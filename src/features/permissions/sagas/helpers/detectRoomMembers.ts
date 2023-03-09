import { call, put } from 'redux-saga/effects'
import { PermissionAssignment, Stream } from 'streamr-client'
import RoomNotFoundError from '$/errors/RoomNotFoundError'
import handleError from '$/utils/handleError'
import { EnsAction } from '$/features/ens'
import getAccountType, { AccountType } from '$/utils/getAccountType'
import { Flag } from '$/features/flag/types'
import { DelegationAction } from '$/features/delegation'
import { PermissionsAction } from '$/features/permissions'
import { IMember } from '$/features/permissions/types'
import fetchStream from '$/utils/fetchStream'

export default function detectRoomMembers({
    roomId,
    streamrClient,
}: ReturnType<typeof PermissionsAction.detectRoomMembers>['payload']) {
    return call(function* () {
        try {
            const members: IMember[] = []

            const stream: Stream | null = yield fetchStream(roomId, streamrClient)

            if (!stream) {
                throw new RoomNotFoundError(roomId)
            }

            const assignments: PermissionAssignment[] = yield stream.getPermissions()

            for (const assignment of assignments) {
                if (!('user' in assignment) || !assignment.user) {
                    // Skip `PublicPermissionAssignment` items.
                    continue
                }

                if (!assignment.permissions.length) {
                    continue
                }

                const accountType = yield* getAccountType(assignment.user)

                if (accountType === AccountType.Delegated) {
                    yield put(
                        DelegationAction.lookup({
                            delegated: assignment.user,
                            fingerprint: Flag.isLookingUpDelegation(assignment.user),
                        })
                    )

                    // Exclude delegated accounts from the members list. When we delete a main/unset
                    // accounts from a room we're gonna fetch the list of delegatees anyway (@TODO).
                    continue
                }

                members.push({
                    address: assignment.user,
                    permissions: assignment.permissions,
                    accountType,
                })
            }

            yield put(PermissionsAction.setRoomMembers({ roomId, members }))

            yield put(EnsAction.fetchNames(members.map(({ address }) => address)))
        } catch (e) {
            handleError(e)
        }
    })
}
