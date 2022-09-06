import { Address } from '$/types'
import { TokenGatedRoomAction } from '$/features/tokenGatedRooms'
import { getJoinPolicyFactory } from '$/features/tokenGatedRooms/utils/getJoinPolicyFactory'
import { getERC20JoinPolicy } from '$/features/tokenGatedRooms/utils/getERC20JoinPolicy'
import { takeEvery } from 'redux-saga/effects'

function* onJoinERC20({
    payload: { owner, tokenAddress, provider, delegatedAccount },
}: ReturnType<typeof TokenGatedRoomAction.joinERC20>) {
    try {
        const factory = getJoinPolicyFactory(provider)
        const policyAddress: Address = yield factory.erc20TokensToJoinPolicies(tokenAddress)
        const policy = getERC20JoinPolicy(policyAddress, provider)
        const canJoin: boolean = yield policy.canJoin(owner)
        if (!canJoin) {
            throw new Error('Cannot join tokenGated room')
        }
        yield policy.requestDelegatedJoin(delegatedAccount)
    } catch (e) {
        console.error(e)
    }
}

export default function* joinERC20() {
    yield takeEvery(TokenGatedRoomAction.joinERC20, onJoinERC20)
}
