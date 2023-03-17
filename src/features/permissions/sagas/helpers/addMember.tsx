import handleError from '$/utils/handleError'
import { call, put } from 'redux-saga/effects'
import { Stream, StreamPermission } from 'streamr-client'
import axios from 'axios'
import { Address } from '$/types'
import { EnsAction } from '$/features/ens'
import { Flag } from '$/features/flag/types'
import setMultiplePermissions from '$/utils/setMultiplePermissions'
import getUserPermissions, { UserPermissions } from '$/utils/getUserPermissions'
import MemberExistsError from '$/errors/MemberExistsError'
import RoomNotFoundError from '$/errors/RoomNotFoundError'
import { PermissionsAction } from '$/features/permissions'
import { Controller } from '$/features/toaster/helpers/toast'
import { ToastType } from '$/components/Toast'
import retoast from '$/features/toaster/helpers/retoast'
import fetchStream from '$/utils/fetchStream'
import i18n from '$/utils/i18n'

function isENS(user: any): boolean {
    return typeof user === 'string' && /\.eth$/.test(user)
}

async function resolveName(user: Address): Promise<null | string> {
    if (!isENS(user)) {
        return user
    }

    const query = `
        query {
            domains(where: { name_in: ${JSON.stringify([user]).toLowerCase()} }) {
                name
                resolvedAddress {
                    id
                }
            }
        }
    `

    try {
        const {
            data: {
                data: {
                    domains: [
                        {
                            resolvedAddress: { id },
                        },
                    ],
                },
            },
        } = await axios.post('https://api.thegraph.com/subgraphs/name/ensdomains/ens', {
            query,
        })

        return id
    } catch (e) {
        // Ignore.
    }

    return null
}

export default function addMember({
    roomId,
    member,
    requester,
}: ReturnType<typeof PermissionsAction.addMember>['payload']) {
    return call(function* () {
        let tc: Controller | undefined

        let dismissToast = false

        try {
            tc = yield retoast(tc, {
                title: i18n('memberToast.addingTitle', member),
                type: ToastType.Processing,
            })

            dismissToast = true

            const user: null | string = yield resolveName(member)

            if (!user) {
                throw new Error('Address could not be resolved')
            }

            const stream: Stream | null = yield fetchStream(roomId)

            if (!stream) {
                throw new RoomNotFoundError(roomId)
            }

            const [currentPermissions]: UserPermissions = yield getUserPermissions(user, stream)

            if (currentPermissions.length) {
                throw new MemberExistsError(member)
            }

            yield setMultiplePermissions(
                roomId,
                [
                    {
                        user,
                        permissions: [StreamPermission.GRANT, StreamPermission.SUBSCRIBE],
                    },
                ],
                {
                    requester,
                }
            )

            dismissToast = false

            tc = yield retoast(tc, {
                title: i18n('memberToast.successTitle', member),
                type: ToastType.Success,
            })

            if (isENS(member)) {
                yield put(
                    EnsAction.store({
                        record: {
                            address: user,
                            content: member,
                        },
                        fingerprint: Flag.isENSNameBeingStored(member),
                    })
                )
            }
        } catch (e) {
            dismissToast = false

            if (e instanceof MemberExistsError) {
                tc = yield retoast(tc, {
                    title: i18n('memberToast.alreadyMemberTitle', e.member),
                    type: ToastType.Error,
                })

                return
            }

            handleError(e)

            tc = yield retoast(tc, {
                title: i18n('memberToast.failureTitle', member),
                type: ToastType.Error,
            })
        } finally {
            if (dismissToast) {
                tc?.dismiss()
            }
        }
    })
}
