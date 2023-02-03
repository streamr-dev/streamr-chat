import { useEffect } from 'react'
import tw from 'twin.macro'
import Page from '$/components/Page'
import AddRoomButton from '$/components/AddRoomButton'
import Conversation from '$/components/Conversation'
import Nav from '$/components/Nav'
import RoomButton from '$/components/RoomButton'
import { useWalletAccount, useWalletClient } from '$/features/wallet/hooks'
import UtilityButton from '$/components/UtilityButton'
import Text from '$/components/Text'
import useRooms from '$/hooks/useRooms'
import useSelectedRoom from '$/hooks/useSelectedRoom'
import { useDispatch } from 'react-redux'
import useProviderChangeEffect from '$/hooks/useProviderChangeEffect'
import { RoomsAction } from '$/features/rooms'
import useListenForInvitesEffect from '$/hooks/useListenForInvitesEffect'
import { RoomAction } from '$/features/room'
import { Flag } from '$/features/flag/types'
import useDetectMembersEffect from '$/hooks/useDetectMembersEffect'
import useAccountModal from '$/hooks/useAccountModal'
import useAddRoomModal from '$/hooks/useAddRoomModal'
import usePreselectRoomEffect from '$/hooks/usePreselectRoomEffect'
import useFlag from '$/hooks/useFlag'

export default function ChatPage() {
    const { open: openAccountModal, modal: accountModal } = useAccountModal()

    const { open: openAddRoomModal, modal: addRoomModal } = useAddRoomModal()

    const selectedRoom = useSelectedRoom()

    const rooms = useRooms()

    const dispatch = useDispatch()

    const account = useWalletAccount()

    const streamrClient = useWalletClient()

    useEffect(() => {
        if (!account || !streamrClient) {
            return
        }

        dispatch(
            RoomsAction.fetch({
                requester: account,
                streamrClient,
            })
        )
    }, [dispatch, account, streamrClient])

    useProviderChangeEffect()

    useListenForInvitesEffect(account, (roomId, invitee) => {
        if (!streamrClient) {
            return
        }

        dispatch(
            RoomAction.registerInvite({
                roomId,
                invitee,
                streamrClient,
                fingerprint: Flag.isInviteBeingRegistered(roomId, invitee),
            })
        )
    })

    useDetectMembersEffect()

    usePreselectRoomEffect()

    const isDisplayingRooms = useFlag(Flag.isDisplayingRooms())

    return (
        <>
            {accountModal}
            {addRoomModal}
            <Page title="Let's chat!">
                <Nav onAccountClick={() => void openAccountModal()} />
                <main
                    css={[
                        tw`
                            w-screen
                            h-screen
                            md:p-10
                            pt-20
                            md:pt-24
                        `,
                    ]}
                >
                    <div
                        css={[
                            tw`
                                w-full
                                h-full
                                relative
                            `,
                        ]}
                    >
                        <aside
                            css={[
                                tw`
                                    hidden
                                    md:block
                                    h-full
                                    w-full
                                    md:w-[22rem]
                                    p-4
                                    md:p-0
                                    overflow-auto
                                    [button + button]:mt-4
                                    [a + a]:mt-4
                                    [button + a]:mt-4
                                    [a + button]:mt-4
                                `,
                                isDisplayingRooms && tw`block`,
                            ]}
                        >
                            <AddRoomButton onClick={() => void openAddRoomModal()} />
                            {(rooms || []).map((room) => (
                                <RoomButton
                                    key={room.id}
                                    active={selectedRoom ? selectedRoom.id === room.id : false}
                                    room={room}
                                />
                            ))}
                        </aside>
                        <div
                            css={[
                                tw`
                                    md:block
                                    bg-white
                                    rounded-t-[10px]
                                    md:rounded-[20px]
                                    absolute
                                    bottom-0
                                    left-0
                                    md:left-[24rem]
                                    right-0
                                    top-0
                                `,
                                isDisplayingRooms && tw`hidden`,
                            ]}
                        >
                            {selectedRoom ? (
                                <Conversation />
                            ) : (
                                <div
                                    css={[
                                        tw`
                                            h-full
                                            w-full
                                            flex
                                            flex-col
                                            items-center
                                            justify-center
                                        `,
                                    ]}
                                >
                                    <UtilityButton onClick={() => void openAddRoomModal()}>
                                        <Text>Add new room</Text>
                                    </UtilityButton>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </Page>
        </>
    )
}
