import { Flag } from '$/features/flag/types'
import { MessageAction } from '$/features/message'
import { IResend } from '$/features/message/types'
import db from '$/utils/db'
import getBeginningOfDay, { DayInMillis, TimezoneOffset } from '$/utils/getBeginningOfDay'
import handleError from '$/utils/handleError'
import { resend as resendUtil } from 'streamr-client-react'
import toLocalMessage from '$/utils/toLocalMessage'
import { call, put } from 'redux-saga/effects'

function formatFilter(timestamp: undefined | number, exact: boolean) {
    if (typeof timestamp === 'undefined') {
        return {
            last: 20,
        }
    }

    if (exact) {
        return {
            from: {
                timestamp,
            },
            to: {
                timestamp,
            },
        }
    }

    return {
        from: {
            timestamp: getBeginningOfDay(timestamp),
        },
        to: {
            timestamp: getBeginningOfDay(timestamp) + DayInMillis - 1,
        },
    }
}

export default function resendMessages({
    roomId,
    requester,
    streamrClient,
    timestamp,
    exact = false,
}: ReturnType<typeof MessageAction.resend>['payload']) {
    return call(function* () {
        try {
            const owner = requester.toLowerCase()

            if (typeof timestamp !== 'undefined' && !exact) {
                const bod = getBeginningOfDay(timestamp)

                // Mark timestamp's beginning of day as the moment from which we display messages.
                yield put(MessageAction.setFromTimestamp({ roomId, requester, timestamp: bod }))

                let dayAlreadyResent = false

                try {
                    const resend: null | IResend = yield db.resends
                        .where({
                            owner,
                            roomId,
                            timezoneOffset: TimezoneOffset,
                            beginningOfDay: bod,
                        })
                        .first()

                    dayAlreadyResent = !!resend
                } catch (e) {
                    // Ignore.
                }

                if (dayAlreadyResent) {
                    // If a resend for a particular beginning of day exists (w/ proper timezone offset)
                    // we skip the actual fetching. We can assume the messages were stored locally along
                    // with the resend record. See below for details on the logic.
                    return
                }
            }

            const queue = resendUtil(roomId, formatFilter(timestamp, exact), streamrClient)

            let minCreatedAt: undefined | number = undefined

            while (true) {
                const { value, done } = yield queue.next()

                if (value) {
                    const message = toLocalMessage(value)

                    const { createdAt } = message

                    yield put(
                        MessageAction.register({
                            owner,
                            message,
                        })
                    )

                    if (typeof createdAt === 'number') {
                        yield put(
                            MessageAction.setFromTimestamp({
                                roomId,
                                requester,
                                timestamp: createdAt,
                            })
                        )

                        if (typeof minCreatedAt === 'undefined' || minCreatedAt > createdAt) {
                            minCreatedAt = createdAt
                        }
                    }
                }

                if (done) {
                    break
                }
            }

            if (exact) {
                return
            }

            if (typeof timestamp !== 'undefined') {
                const eod = getBeginningOfDay(timestamp) + DayInMillis - 1

                const currentBod = getBeginningOfDay(Date.now())

                // We only record a `resend` when its day is over. We always resend "today".
                if (eod < currentBod) {
                    try {
                        yield db.resends.add({
                            owner: requester.toLowerCase(),
                            roomId,
                            beginningOfDay: getBeginningOfDay(timestamp),
                            timezoneOffset: TimezoneOffset,
                        })
                    } catch (e) {
                        handleError(e)
                    }
                }

                return
            }

            // This happens only to `resend` calls without timestamp (the initial one).
            if (typeof minCreatedAt !== 'undefined') {
                yield put(
                    MessageAction.resend({
                        roomId,
                        requester,
                        streamrClient,
                        timestamp: minCreatedAt,
                        fingerprint: Flag.isResendingMessagesForSpecificDay(
                            roomId,
                            requester,
                            minCreatedAt
                        ),
                    })
                )
            }
        } catch (e: any) {
            if (e instanceof Error && /no storage assigned/i.test(e.message)) {
                return
            }

            handleError(e)
        }
    })
}
