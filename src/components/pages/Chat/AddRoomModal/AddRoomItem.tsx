import { useEffect, useState } from 'react'
import styled from 'styled-components'
import useCreateRoom from '../../../../hooks/useCreateRoom'
import type { Props } from '../SidebarItem'
import SidebarItem from '../SidebarItem'
import { KARELIA } from '../../../../utils/css'
import ReactModal from 'react-modal'
import PrivacySelect from './PrivacySelect'

import getRandomRoomName from '../../../../getters/getRandomRoomName'

const IconWrap = styled.div`
    padding: 13px;
`

const customStyles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    content: {
        border: 'none',
        width: '528px',
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        borderRadius: '20px',
        transform: 'translate(-50%, -50%)',
        fontFamily: `${KARELIA}`,
    },
}

const CreateButton = styled.button`
    align-items: center;
    background: #ff5924;
    border-radius: 100px;
    border: none;
    box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.1);
    color: white;
    display: inline-flex;
    height: auto;
    font-family: ${KARELIA};
    font-size: 18px;
    padding: 10px 30px;

    :hover,
    :focus {
        background-color: #de4716;
    }

    div {
        margin-right: 16px;
        transform: translateY(-0.1em);
    }

    svg {
        display: block;
    }

    :disabled {
        background: #ff5924;
        opacity: 0.5;
    }
`

const Subheading = styled.h3`
    color: #36404e;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 7px;
`

const Subtitle = styled.h3`
    margin-top: 7px;
    font-weight: normal;
    font-size: 14px;
    color: #59799c;
`

const CloseButton = styled.button`
    background-color: transparent;
    border: none;
`

const StyledModalContent = styled.div`
    display: flex;

    input {
        appearance: none;
        background: #dee6ee;
        border: 0;
        outline: 0;
        width: 100%;
        padding: 13px 16px;
        font-size: 16px;
        border-radius: 8px;
    }

    ${CreateButton} {
        float: right;
    }
`

const ModalContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100%;
    height: 440px;
    padding: 0px 20px;
`

const ModalHeader = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`

function UnstyledAddRoomItem(props: Props) {
    const createRoom = useCreateRoom()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [roomName, setRoomName] = useState(getRandomRoomName())
    const [privacy, setPrivacy] = useState()

    const closeModal = () => {
        setModalIsOpen(false)
        // replace the random name after modal closes
        setRoomName(getRandomRoomName())
    }

    const handleChangeRoomName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRoomName(e.target.value)
    }

    useEffect(() => {
        if (!modalIsOpen) {
            setPrivacy(undefined)
        }
    }, [modalIsOpen])

    return (
        <>
            <SidebarItem
                {...props}
                onClick={() => {
                    setModalIsOpen(true)
                }}
                icon={
                    <IconWrap>
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M10.2544 21.4911C10.4522 21.6889 10.7205 21.8 11.0002 21.8C11.2799 21.8 11.5482 21.6889 11.746 21.4911C11.9438 21.2933 12.0549 21.025 12.0549 20.7453V12.0547H20.7455C21.0252 12.0547 21.2935 11.9436 21.4913 11.7458C21.6891 11.548 21.8002 11.2797 21.8002 11C21.8002 10.7203 21.6891 10.452 21.4913 10.2542C21.2935 10.0564 21.0252 9.94532 20.7455 9.94532H12.0549V1.2547C12.0549 0.974979 11.9438 0.706715 11.746 0.508923C11.5482 0.311131 11.2799 0.200012 11.0002 0.200012C10.7205 0.200012 10.4522 0.311131 10.2544 0.508923C10.0566 0.706715 9.94551 0.974979 9.94551 1.2547V9.94532H1.25488C0.975162 9.94532 0.706898 10.0564 0.509106 10.2542C0.311314 10.452 0.200195 10.7203 0.200195 11C0.200195 11.2797 0.311314 11.548 0.509106 11.7458C0.706898 11.9436 0.975162 12.0547 1.25488 12.0547H9.94551V20.7453C9.94551 21.025 10.0566 21.2933 10.2544 21.4911Z"
                                fill="black"
                            />
                        </svg>
                    </IconWrap>
                }
            >
                Add new room
            </SidebarItem>
            <ReactModal
                appElement={document.getElementById('root') as HTMLElement}
                isOpen={modalIsOpen}
                contentLabel="Connect a wallet"
                style={customStyles}
            >
                <StyledModalContent>
                    <ModalContainer>
                        <ModalHeader>
                            <h2>Create new room</h2>
                            <CloseButton
                                onClick={closeModal}
                                type="button"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M15 1L0.999999 15"
                                        stroke="#59799C"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M1 1L15 15"
                                        stroke="#59799C"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </CloseButton>
                        </ModalHeader>
                        <div>
                            <form
                                onSubmit={(e) => {
                                    createRoom(roomName)
                                    closeModal()
                                    e.preventDefault()
                                }}
                            >
                                <Subheading>Name</Subheading>
                                <input
                                    value={roomName}
                                    onChange={handleChangeRoomName}
                                />
                                <Subtitle>
                                    Room name is generated randomly but you can
                                    provide your own, as long as it's unique in
                                    your account. The room name will be publicly
                                    visible.
                                    <br />
                                    You may use alphanumeric characters, as well
                                    as dashes (-) and underscores (_) for room
                                    names.{' '}
                                </Subtitle>
                                <Subheading>Choose privacy</Subheading>
                                <PrivacySelect
                                    value={privacy}
                                    onChange={(option: any) => void setPrivacy(option)}
                                />
                                <CreateButton
                                    type="submit"
                                    disabled={!roomName || !privacy}
                                >
                                    Create
                                </CreateButton>
                            </form>
                        </div>
                    </ModalContainer>
                </StyledModalContent>
            </ReactModal>
        </>
    )
}

const AddRoomItem = styled(UnstyledAddRoomItem)`
    font-size: 1.125rem;

    svg {
        display: block;
    }
`

export default AddRoomItem
