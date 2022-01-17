import { MetaMaskInpageProvider } from '@metamask/providers'
import { StreamrClient, Stream, StreamOperation } from 'streamr-client'
import { ChatMessage, ChatRoom } from '../utils/types'

const ROOM_PREFIX: string = 'streamr-chat/room'
const STREAM_PARTITION_MESSAGES = 0
const STREAM_PARTITION_METADATA = 1
const LOCAL_STORAGE_KEY = 'streamr-chat-rooms'

const publishMessage = async (
    client: StreamrClient,
    streamId: string,
    message: string
): Promise<any> => {
    return client.publish(
        streamId,
        {
            type: 'text',
            payload: message,
        },
        Date.now(),
        STREAM_PARTITION_MESSAGES
    )
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const publishMetadata = async (
    client: StreamrClient,
    streamId: string,
    metadata: any
): Promise<any> => {
    return client.publish(
        streamId,
        {
            type: 'metadata',
            payload: metadata,
        } as ChatMessage,
        Date.now(),
        STREAM_PARTITION_METADATA
    )
}

const subscribeMessages = async (
    client: StreamrClient,
    streamId: string,
    callback: (message: ChatMessage) => void
): Promise<void> => {
    client.subscribe(
        {
            streamId,
            streamPartition: STREAM_PARTITION_MESSAGES,
        },
        (message: any) => {
            //callback(JSON.parse(message))
            callback(message)
        }
    )
}

const subscribeMetadata = async (
    client: StreamrClient,
    streamId: string,
    callback: (metadata: any) => void
): Promise<void> => {
    client.subscribe(
        {
            streamId,
            streamPartition: STREAM_PARTITION_METADATA,
        },
        (message: any) => {
            callback(message)
        }
    )
}

const getRoomNameFromStreamId = (streamId: string): string => {
    return streamId.substring(streamId.lastIndexOf('/') + 1)
}

export const generateChatRoom = async (
    client: StreamrClient,
    streamId: string,
    stream?: Stream
): Promise<ChatRoom> => {
    return {
        id: streamId,
        name: getRoomNameFromStreamId(streamId),
        stream: stream || (await client.getStream(streamId)),
        publishMessage: (message: string) =>
            publishMessage(client, streamId, message),
        publishMetadata: (metadata: any) =>
            publishMetadata(client, streamId, metadata),
        subscribeMessages: (callback: (message: ChatMessage) => void) =>
            subscribeMessages(client, streamId, callback),
        subscribeMetadata: (callback: (metadata: any) => void) =>
            subscribeMetadata(client, streamId, callback),
    } as ChatRoom
}

const getStreamIdFromRoomName = (
    clientAddress: string,
    roomName: string,
    requireEncryptedData = false
): string => {
    const encryptionPrefix = requireEncryptedData ? 'encrypted/' : ''
    return `${clientAddress}/${ROOM_PREFIX}/${encryptionPrefix}${roomName}`.toLowerCase()
}

export const sendChatRoomInvitation = async (
    client: StreamrClient,
    streamId: string,
    recipient: string
): Promise<void> => {
    const stream = await client.getStream(streamId)
    await stream.grantPermissions(
        [
            StreamOperation.STREAM_PUBLISH,
            StreamOperation.STREAM_SUBSCRIBE,
            StreamOperation.STREAM_SHARE,
            StreamOperation.STREAM_GET,
        ],
        recipient
    )
}

const storeRoomIds = (ids: Array<string>) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids))
}

export const createRoom = async (
    client: StreamrClient,
    metamaskAddress: string,
    roomName: string,
    roomIds: Array<string>,
    requireEncryptedData = false
): Promise<ChatRoom> => {
    const streamId = getStreamIdFromRoomName(
        await client.getAddress(),
        roomName,
        requireEncryptedData
    )

    console.log(streamId, client)

    const stream = await client.createStream({
        id: streamId,
        partitions: 2,
        requireEncryptedData,
    })

    await sendChatRoomInvitation(client, streamId, metamaskAddress)

    const room = await generateChatRoom(client, streamId, stream)
    roomIds.push(room.id)
    storeRoomIds(roomIds)
    return room
}

export const fetchRooms = async (
    client: StreamrClient,
    provider: MetaMaskInpageProvider,
    roomCallback?: (c: ChatRoom) => void
): Promise<Array<ChatRoom>> => {
    const rooms: Array<ChatRoom> = []

    const localStreamIds = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (localStreamIds) {
        // build the room objects from the local ref
        const streamIds = JSON.parse(localStreamIds)

        for (let i = 0; i < streamIds.length; i++) {
            try {
                const streamId = streamIds[i]
                const room = await generateChatRoom(client, streamId)
                if (roomCallback) {
                    roomCallback(room)
                }
                rooms.push(room)
            } catch (e) {
                console.warn('failed to load room', e)
            }
        }
    } else {
        // create a metamask/streamr-client instance to fetch the parent identity's streams
        const fetchClient = new StreamrClient({
            auth: { ethereum: provider as any },
        })
        const streams = await fetchClient.listStreams({
            search: 'streamr-chat/room',
            operation: 'stream_subscribe' as StreamOperation,
        })

        const clientAddress = await client.getAddress()

        for (let i = 0; i < streams.length; i++) {
            try {
                const stream = streams[i]
                const hasPermission = await stream.hasUserPermission(
                    'stream_subscribe' as StreamOperation,
                    clientAddress
                )
                if (!hasPermission) {
                    await stream.grantUserPermissions(
                        [
                            'stream_subscribe' as StreamOperation,
                            'stream_share' as StreamOperation,
                            'stream_publish' as StreamOperation,
                            'stream_get' as StreamOperation,
                        ],
                        clientAddress
                    )
                }
                if (stream.id.includes(ROOM_PREFIX)) {
                    const chatRoom = await generateChatRoom(
                        client,
                        stream.id,
                        stream
                    )
                    if (roomCallback) {
                        roomCallback(chatRoom)
                    }
                    rooms.push(chatRoom)
                }
            } catch (e) {
                console.warn('failed to fetch room', e)
            }
        }

        // save the streamIds to local storage
        storeRoomIds(streams.map((stream: Stream) => stream.id))
    }

    return rooms
}
