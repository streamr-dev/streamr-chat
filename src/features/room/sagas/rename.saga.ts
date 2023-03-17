import { put } from 'redux-saga/effects'
import RoomNotFoundError from '$/errors/RoomNotFoundError'
import preflight from '$/utils/preflight'
import { RoomAction } from '..'
import handleError from '$/utils/handleError'
import { IRoom } from '$/features/room/types'
import db from '$/utils/db'
import RedundantRenameError from '$/errors/RedundantRenameError'
import takeEveryUnique from '$/utils/takeEveryUnique'
import { Flag } from '$/features/flag/types'
import { FlagAction } from '$/features/flag'
import { Stream, StreamMetadata } from 'streamr-client'
import getRoomMetadata, { RoomMetadata } from '$/utils/getRoomMetadata'
import toast from '$/features/toaster/helpers/toast'
import { ToastType } from '$/components/Toast'
import fetchStream from '$/utils/fetchStream'
import i18n from '$/utils/i18n'

function* onRenameAction({
    payload: { roomId, name, requester, streamrClient },
}: ReturnType<typeof RoomAction.rename>) {
    try {
        const stream: Stream | null = yield fetchStream(roomId, streamrClient)

        if (!stream) {
            throw new RoomNotFoundError(roomId)
        }

        const roomMetadata = getRoomMetadata(stream)

        if (roomMetadata.name === name) {
            yield toast({
                title: i18n('roomRenameToast.upToDateTitle'),
                type: ToastType.Info,
            })

            try {
                /**
                 * Let's check if the name of the room cached locally is equal to the remote
                 * room's name. Trigger a sync if it's not.
                 */
                const room: undefined | IRoom = yield db.rooms.where('id').equals(roomId).first()

                if (room && room.name !== name) {
                    // Current local name and current remote names don't match up. Let's sync.
                    yield put(
                        RoomAction.sync({
                            roomId,
                            requester,
                            streamrClient,
                            fingerprint: Flag.isSyncingRoom(roomId),
                        })
                    )
                }
            } catch (e) {
                handleError(e)
            }

            throw new RedundantRenameError()
        }

        yield preflight(requester)

        yield stream.update({
            description: name,
            extensions: {
                'thechat.eth': {
                    ...roomMetadata,
                    updatedAt: Date.now(),
                },
            },
        } as Partial<StreamMetadata> & Record<'extensions', Partial<Record<'thechat.eth', RoomMetadata>>>)

        yield put(
            RoomAction.renameLocal({
                roomId,
                name,
            })
        )

        yield put(FlagAction.unset(Flag.isRoomNameBeingEdited(roomId)))

        yield toast({
            title: i18n('roomRenameToast.successTitle'),
            type: ToastType.Success,
        })
    } catch (e) {
        if (e instanceof RedundantRenameError) {
            return
        }

        handleError(e)

        yield toast({
            title: i18n('roomRenameToast.failureTitle'),
            type: ToastType.Error,
        })
    }
}

export default function* rename() {
    yield takeEveryUnique(RoomAction.rename, onRenameAction)
}
