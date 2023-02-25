import { useEffect, useState } from 'react'
import tw from 'twin.macro'
import isBlank from '$/utils/isBlank'
import Form from '../Form'
import Hint from '../Hint'
import Label from '../Label'
import Submit from '../Submit'
import Text from '../Text'
import TextField from '../TextField'
import Toggle from '../Toggle'
import { Prefix, PrivacyOption, PrivacySetting } from '$/types'
import ButtonGroup, { GroupedButton } from '$/components/ButtonGroup'
import PrivacySelectField, {
    privacyOptions,
    PrivateRoomOption,
} from '$/components/PrivacySelectField'
import Modal, { AbortReason, Props as ModalProps } from '$/components/modals/Modal'
import { RoomId } from '$/features/room/types'
import useFlag from '$/hooks/useFlag'
import { Flag } from '$/features/flag/types'
import pathnameToRoomIdPartials from '$/utils/pathnameToRoomIdPartials'

export interface Pin {
    roomId: RoomId
    tokenId: string
}

export interface NewRoom {
    name: string
    privacy: PrivacySetting
    storage: boolean
}

export const defaultParams: NewRoom = {
    name: '',
    privacy: PrivacySetting.Private,
    storage: true,
}

interface Props extends ModalProps {
    onProceed?: (params: Pin | NewRoom) => void
    params?: Pin | NewRoom
}

function getPrivacyOptionForSetting(value: PrivacySetting): PrivacyOption {
    return privacyOptions.find((option) => option.value === value) || PrivateRoomOption
}

export default function AddRoomModal({
    title = 'Add new room',
    params = defaultParams,
    onProceed,
    ...props
}: Props) {
    const [privacySetting, setPrivacySetting] = useState<PrivacyOption>(
        getPrivacyOptionForSetting('privacy' in params ? params.privacy : defaultParams.privacy)
    )

    const [roomName, setRoomName] = useState<string>(
        'name' in params ? params.name : defaultParams.name
    )

    const [storage, setStorage] = useState<boolean>(
        'storage' in params ? params.storage : defaultParams.storage
    )

    const [roomId, setRoomId] = useState<string>('roomId' in params ? params.roomId : '')

    const [tokenId, setTokenId] = useState<string>('tokenId' in params ? params.tokenId : '0')

    useEffect(() => {
        if ('roomId' in params) {
            setRoomId(params.roomId)
            return
        }

        setPrivacySetting(getPrivacyOptionForSetting(params.privacy))

        setRoomName(params.name)

        setStorage(params.storage)
    }, [params])

    const canCreate = !isBlank(roomName)

    const [createNew, setCreateNew] = useState<boolean>(true)

    const isPinning = useFlag(Flag.isRoomBeingPinned())

    const partials = pathnameToRoomIdPartials(roomId)

    const canPin = typeof partials !== 'string' && !isPinning

    const createSubmitLabel = privacySetting.value === PrivacySetting.TokenGated ? 'Next' : 'Create'

    return (
        <Modal
            {...props}
            title={title}
            onBeforeAbort={(reason) => {
                if (reason === AbortReason.Backdrop) {
                    if (createNew) {
                        return (
                            privacySetting === PrivateRoomOption &&
                            isBlank(roomName) &&
                            storage === defaultParams.storage
                        )
                    }

                    return isBlank(roomId)
                }
            }}
        >
            {!isPinning && (
                <ButtonGroup>
                    <GroupedButton active={createNew} onClick={() => void setCreateNew(true)}>
                        Add a room
                    </GroupedButton>
                    <GroupedButton active={!createNew} onClick={() => void setCreateNew(false)}>
                        Pin existing room
                    </GroupedButton>
                </ButtonGroup>
            )}
            {createNew ? (
                <Form
                    onSubmit={() => {
                        if (!canCreate) {
                            return
                        }

                        onProceed?.({
                            name: roomName,
                            storage,
                            privacy: privacySetting.value,
                        })
                    }}
                >
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
                    <>
                        <Label>Message storage</Label>
                        <div css={tw`flex`}>
                            <div css={tw`grow`}>
                                <Hint css={tw`pr-16`}>
                                    <Text>
                                        When message storage is disabled, participants will only see
                                        messages sent while they are online.
                                    </Text>
                                </Hint>
                            </div>
                            <div css={tw`mt-2`}>
                                <Toggle
                                    value={storage}
                                    onClick={() => {
                                        setStorage((c) => !c)
                                    }}
                                />
                            </div>
                        </div>
                    </>
                    <>
                        <Submit label={createSubmitLabel} disabled={!canCreate} />
                    </>
                </Form>
            ) : (
                <Form
                    onSubmit={() => {
                        if (!canPin) {
                            return
                        }

                        onProceed?.({
                            roomId: `${partials.account}/${Prefix.Room}/${partials.uuid}`,
                            tokenId,
                        })
                    }}
                >
                    <>
                        <Label htmlFor="roomId">Room ID</Label>
                        <TextField
                            id="roomId"
                            value={roomId}
                            onChange={(e) => void setRoomId(e.target.value)}
                            autoFocus
                            autoComplete="off"
                        />

                        <Label htmlFor="tokenId">Token ID</Label>
                        <TextField
                            id="tokenId"
                            value={tokenId}
                            onChange={(e) => void setTokenId(e.target.value)}
                            autoComplete="off"
                        />
                        <Hint css={tw`pr-16`}>
                            <Text>
                                If you are pinning a token-gated room with an NFT enter the token ID
                                here.
                            </Text>
                        </Hint>
                    </>
                    <>
                        <Submit label="Pin" disabled={!canPin} />
                    </>
                </Form>
            )}
        </Modal>
    )
}
