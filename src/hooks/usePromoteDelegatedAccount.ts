import { useDelegatedAccount } from '$/features/delegation/hooks'
import { Flag } from '$/features/flag/types'
import { PermissionsAction } from '$/features/permissions'
import { usePrivacy, useSelectedRoomId } from '$/features/room/hooks'
import { useWalletAccount, useWalletClient, useWalletProvider } from '$/features/wallet/hooks'
import { PrivacySetting } from '$/types'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

export default function usePromoteDelegatedAccount() {
    const dispatch = useDispatch()

    const roomId = useSelectedRoomId()

    const delegatedAddress = useDelegatedAccount()

    const provider = useWalletProvider()

    const requester = useWalletAccount()

    const streamrClient = useWalletClient()

    const privacy = usePrivacy(roomId)

    return useCallback(() => {
        if (!roomId || !delegatedAddress || !provider || !requester || !streamrClient || !privacy) {
            return
        }

        if (privacy === PrivacySetting.TokenGated) {
            return void dispatch(
                PermissionsAction.tokenGatedPromoteDelegatedAccount({
                    roomId,
                    delegatedAddress,
                    provider,
                    requester,
                    streamrClient,
                    fingerprint: Flag.isDelegatedAccountBeingPromoted(roomId, delegatedAddress),
                })
            )
        }

        dispatch(
            PermissionsAction.promoteDelegatedAccount({
                roomId,
                delegatedAddress,
                provider,
                requester,
                streamrClient,
                fingerprint: Flag.isDelegatedAccountBeingPromoted(roomId, delegatedAddress),
            })
        )
    }, [roomId, delegatedAddress, provider, requester, streamrClient])
}
