import { useState } from 'react'
import { useDispatch } from 'react-redux'
import tw from 'twin.macro'
import { useWalletAccount, useWalletClient, useWalletProvider } from '$/features/wallet/hooks'
import isBlank from '$/utils/isBlank'
import Form from '../Form'
import Hint from '../Hint'
import Label from '../Label'
import Modal, { ModalProps } from './Modal'
import Submit from '../Submit'
import Text from '../Text'
import TextField from '../TextField'
import Toggle from '../Toggle'
import { v4 as uuidv4 } from 'uuid'
import { Address, Prefix, PrivacyOption, PrivacySetting } from '$/types'
import { RoomAction } from '$/features/room'
import ButtonGroup, { GroupedButton } from '$/components/ButtonGroup'
import { Flag } from '$/features/flag/types'
import PrivacySelectField, { PrivateRoomOption } from '$/components/PrivacySelectField'
import { useDelegatedAccount } from '$/features/delegation/hooks'
import { error } from '$/utils/toaster'
import { TokenType, TokenTypes } from '$/features/tokenGatedRooms/types'
import { getTokenType } from '$/features/tokenGatedRooms/utils/getTokenType'

export default function AddRoomModal({ setOpen, ...props }: ModalProps) {
    const [privacySetting, setPrivacySetting] = useState<PrivacyOption>(PrivateRoomOption)

    const [roomName, setRoomName] = useState<string>('')

    const canCreate = !isBlank(roomName)

    const dispatch = useDispatch()

    const account = useWalletAccount()

    const [storage, setStorage] = useState<boolean>(true)

    function onStorageToggleClick() {
        setStorage((current) => !current)
    }

    const [createNew, setCreateNew] = useState<boolean>(true)

    const [roomId, setRoomId] = useState<string>('')

    const canPin = !isBlank(roomId)

    const createSubmitLabel = privacySetting.value === PrivacySetting.TokenGated ? 'Next' : 'Create'
    const [isTokenGatedRoom, setIsTokenGatedRoom] = useState<boolean>(false)
    const [tokenAddress, setTokenAddress] = useState<Address>('')
    const [tokenType, setTokenType] = useState<TokenType>(TokenTypes.unknown)
    const [tokenId, setTokenId] = useState<number>(0)
    const [minTokenAmount, setMinTokenAmount] = useState<string>('')

    function onClose() {
        setRoomName('')
        setPrivacySetting(PrivateRoomOption)
        setRoomId('')
        setIsTokenGatedRoom(false)
        setTokenAddress('')
        setTokenType(TokenTypes.unknown)
        setTokenId(0)
        setMinTokenAmount('')
    }

    const provider = useWalletProvider()

    const streamrClient = useWalletClient()

    async function onSubmitCreate() {
        if (!canCreate || !provider || !streamrClient || !account) {
            return
        }

        const now = Date.now()

        if (!isTokenGatedRoom && privacySetting.value === PrivacySetting.TokenGated) {
            // display the next window for the token-gated creation
            const tokenType = await getTokenType(tokenAddress, provider)
            if (tokenType.standard === TokenTypes.ERC20.standard) {
                setTokenType(tokenType)
                setCreateNew(false)
                setIsTokenGatedRoom(true)
            } else {
                error(`Token type ${tokenType.standard} not implemented`)
            }
            return
        } else {
            dispatch(
                RoomAction.create({
                    params: {
                        createdAt: now,
                        createdBy: account!,
                        id: `/${Prefix.Room}/${uuidv4()}`,
                        name: roomName,
                        owner: account!,
                        updatedAt: now,
                        tokenAddress,
                        tokenId,
                        minTokenAmount: parseFloat(minTokenAmount) || 0,
                        tokenType,
                    },
                    privacy: privacySetting.value,
                    storage,
                    provider,
                    requester: account,
                    streamrClient,
                })
            )
        }

        if (typeof setOpen === 'function') {
            setOpen(false)
            onClose()
        }
    }

    const delegatedAccount = useDelegatedAccount()

    function onSubmitPin() {
        if (!canPin || !account || !streamrClient || !provider || !delegatedAccount) {
            return
        }
        dispatch(
            RoomAction.pin({
                roomId,
                requester: account,
                streamrClient,
                fingerprint: Flag.isRoomBeingPinned(roomId, account),
                provider,
                delegatedAccount,
            })
        )

        if (typeof setOpen === 'function') {
            setOpen(false)
            onClose()
        }
    }

    return (
        <Modal {...props} title="Add new room" setOpen={setOpen} onClose={onClose}>
            {!isTokenGatedRoom ? (
                <ButtonGroup>
                    <GroupedButton active={createNew} onClick={() => void setCreateNew(true)}>
                        Add a room
                    </GroupedButton>
                    <GroupedButton active={!createNew} onClick={() => void setCreateNew(false)}>
                        Pin existing room
                    </GroupedButton>
                </ButtonGroup>
            ) : null}
            {createNew ? (
                <Form onSubmit={onSubmitCreate}>
                    <>
                        <Label htmlFor="roomName">Name</Label>
                        <TextField
                            placeholder="e.g. giggling-bear"
                            id="roomName"
                            value={roomName}
                            onChange={(e) => void setRoomName(e.target.value)}
                            autoFocus
                        />
                        <Hint>The room name will be publicly visible.</Hint>
                    </>
                    <>
                        <Label>Choose privacy</Label>
                        <PrivacySelectField
                            value={privacySetting}
                            onChange={(option) => void setPrivacySetting(option as PrivacyOption)}
                        />
                    </>
                    {privacySetting.value === PrivacySetting.TokenGated && (
                        <>
                            <Label htmlFor="tokenAddress">Token Address</Label>
                            <TextField
                                id="tokenAddress"
                                value={tokenAddress!}
                                onChange={(e) => void setTokenAddress(e.target.value)}
                                autoFocus
                                autoComplete="off"
                            />
                        </>
                    )}
                    <>
                        <Label>Message storage</Label>
                        <div
                            css={[
                                tw`
                                    flex
                                `,
                            ]}
                        >
                            <div
                                css={[
                                    tw`
                                        flex-grow
                                    `,
                                ]}
                            >
                                <Hint
                                    css={[
                                        tw`
                                            pr-16
                                        `,
                                    ]}
                                >
                                    <Text>
                                        When message storage is disabled, participants will only see
                                        messages sent while they are online.
                                    </Text>
                                </Hint>
                            </div>
                            <div
                                css={[
                                    tw`
                                        mt-2
                                    `,
                                ]}
                            >
                                <Toggle value={storage} onClick={onStorageToggleClick} />
                            </div>
                        </div>
                    </>
                    <>
                        <Submit label={createSubmitLabel} disabled={!canCreate} />
                    </>
                </Form>
            ) : isTokenGatedRoom ? (
                <Form onSubmit={onSubmitCreate}>
                    <>
                        <Label htmlFor="roomName">Room Name</Label>

                        <TextField id="roomName" value={roomName} readOnly />
                        <Label htmlFor="tokenAddress">Token Address</Label>

                        <TextField id="tokenAddress" value={tokenAddress} readOnly />

                        <Label htmlFor="tokenStandard">Token Standard</Label>

                        <TextField id="tokenStandard" value={tokenType.standard} readOnly />

                        {tokenType.hasIds && (
                            <>
                                <Label htmlFor="tokenId">Token ID</Label>
                                <TextField
                                    id="tokenId"
                                    value={tokenId}
                                    onChange={(e) => void setTokenId(parseInt(e.target.value))}
                                />
                            </>
                        )}

                        {tokenType.isCountable && (
                            <>
                                <Label htmlFor="minTokenAmount">Minimum Token Amount</Label>
                                <TextField
                                    id="minTokenAmount"
                                    value={minTokenAmount}
                                    onChange={(e) => void setMinTokenAmount(e.target.value)}
                                />
                            </>
                        )}

                        <Submit label="Create" disabled={false /*!canCreateTokenGatedRoom*/} />
                    </>
                </Form>
            ) : (
                <Form onSubmit={onSubmitPin}>
                    <>
                        <Label htmlFor="roomId">Room ID</Label>
                        <TextField
                            id="roomId"
                            value={roomId}
                            onChange={(e) => void setRoomId(e.target.value)}
                            autoFocus
                            autoComplete="off"
                        />
                    </>
                    <>
                        <Submit label="Pin" disabled={!canPin} />
                    </>
                </Form>
            )}
        </Modal>
    )
}
