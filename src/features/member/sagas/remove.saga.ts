import { MemberAction } from '$/features/member'
import handleError from '$/utils/handleError'
import { error, success } from '$/utils/toaster'
import { call } from 'redux-saga/effects'
import setMultiplePermissions from '$/sagas/setMultiplePermissions.saga'
import takeEveryUnique from '$/utils/takeEveryUnique'
import trunc from '$/utils/trunc'

function* onRemoveAction({
    payload: { roomId, member, provider, requester, streamrClient },
}: ReturnType<typeof MemberAction.remove>) {
    try {
        yield call(
            setMultiplePermissions,
            roomId,
            [
                {
                    user: member,
                    permissions: [],
                },
            ],
            {
                provider,
                requester,
                streamrClient,
            }
        )

        success(`"${trunc(member)}" successfully removed.`)
    } catch (e) {
        handleError(e)

        error(`Failed to remove "${trunc(member)}".`)
    }
}

export default function* remove() {
    yield takeEveryUnique(MemberAction.remove, onRemoveAction)
}
