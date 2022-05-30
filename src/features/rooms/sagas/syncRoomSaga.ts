import { call, takeLatest } from 'redux-saga/effects'
import StreamrClient, { PermissionAssignment, Stream, StreamPermission } from 'streamr-client'
import { Address } from '../../../../types/common'
import getWalletAccountSaga from '../../wallet/sagas/getWalletAccountSaga'
import getWalletClientSaga from '../../wallet/sagas/getWalletClientSaga'
import getStream from '../../../utils/getStream'
import handleError from '../../../utils/handleError'
import { RoomAction, syncRoom } from '../actions'
import deleteLocalRoomSaga from './deleteLocalRoomSaga'
import renameLocalRoomSaga from './renameLocalRoomSaga'

async function getUserPermissions(user: Address, stream: Stream) {
    const assignments: PermissionAssignment[] = await stream.getPermissions()

    const assignment = assignments.find(
        (assignment) => 'user' in assignment && assignment.user.toLowerCase() === user.toLowerCase()
    )

    return assignment ? assignment.permissions : []
}

function* onSyncRoomAction({ payload: roomId }: ReturnType<typeof syncRoom>) {
    try {
        const client: StreamrClient = yield call(getWalletClientSaga)

        const account: Address = yield call(getWalletAccountSaga)

        const stream: undefined | Stream = yield getStream(client, roomId)

        if (stream) {
            const permissions: StreamPermission[] = yield getUserPermissions(account, stream)

            if (permissions.length) {
                yield call(renameLocalRoomSaga, roomId, stream.description || '')
                return
            }
        }

        // At this point we know that the stream isn't there, or we don't have anything to do with
        // it (no explicit permissions). Let's remove it from the navigation sidebar.

        yield call(deleteLocalRoomSaga, roomId, account.toLowerCase())
    } catch (e) {
        handleError(e)
    }
}

export default function* syncRoomSaga() {
    yield takeLatest(RoomAction.SyncRoom, onSyncRoomAction)
}
