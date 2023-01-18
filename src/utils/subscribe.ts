import { StreamMessage } from '$/features/message/types'
import { RoomId } from '$/features/room/types'
import handleError from '$/utils/handleError'
import StreamrClient, { Subscription } from 'streamr-client'
import { StreamMessage as StreamrMessage } from 'streamr-client-protocol'

type Message = StreamrMessage<StreamMessage>

function isMessage(e: any): e is Message {
    return !!e
}

export default function subscribe(roomId: RoomId, streamrClient: StreamrClient) {
    // Needs revisiting, streamr-client v7.2.0 complains about types
    // let sub: undefined | Subscription<StreamMessage>
    let sub: undefined | Subscription
    let cancelled = false

    function unsub() {
        if (sub) {
            streamrClient.unsubscribe(sub)
            sub = undefined
        }
    }

    const rs = new ReadableStream<Message>({
        async start(controller: ReadableStreamDefaultController<Message>) {
            try {
                sub = await streamrClient.subscribe(
                    {
                        streamId: roomId,
                    },
                    // Add proper typing (@TODO)
                    (_, { streamMessage }: any) => {
                        controller.enqueue(streamMessage)
                    }
                )

                if (cancelled) {
                    return void unsub()
                }

                sub.on('error', (e: any) => {
                    const raw = e.streamMessage

                    if (!isMessage(raw)) {
                        return
                    }

                    controller.enqueue(raw)
                })
            } catch (e) {
                handleError(e)
            }
        },
        cancel() {
            unsub()
            cancelled = true
        },
    })

    const reader = rs.getReader()

    return {
        async next() {
            return reader.read()
        },
        async abort() {
            await reader.cancel()
        },
    }
}
