import { HTMLAttributes, ReactNode } from 'react'
import useGlobalKeyDownEffect from 'streamr-ui/hooks/useGlobalKeyDownEffect'
import tw from 'twin.macro'

export enum AbortReason {
    CloseButton,
    Backdrop,
    Escape
}

export interface Props {
    children?: ReactNode
    title?: string
    subtitle?: string
    onAbort?: (reason?: any) => void
    onBeforeAbort?: (reason?: any) => boolean | void
}

export default function Modal({ title = 'Untitled dialog', subtitle, children, onAbort, onBeforeAbort }: Props) {
    function close(reason?: any) {
        if (onBeforeAbort?.(reason) === false) {
            return
        }

        onAbort?.(reason)
    }

    useGlobalKeyDownEffect((e) => {
        if (e.key === 'Escape') {
            close(AbortReason.Escape)
        }
    })

    return (
        <>
            {/* Backdrop. */}
            <div
                onMouseDown={() => void close(AbortReason.Backdrop)}
                css={[
                    tw`
                        bg-[rgba(0, 0, 0, 0.3)]
                        backdrop-blur
                        fixed
                        top-0
                        left-0
                        w-full
                        h-full
                    `,
                ]}
            />
            {/* Modal. */}
            <div
                css={[
                    tw`
                        -translate-x-1/2
                        -translate-y-1/2
                        fixed
                        left-1/2
                        max-w-[560px]
                        top-1/2
                        w-[90vw]
                    `,
                ]}
            >
                <div
                    css={[
                        tw`
                            bg-[white]
                            p-12
                            pt-8
                            rounded-[20px]
                            shadow-lg
                            animate-[bringIn 150ms ease-in-out 1]
                        `,
                    ]}
                >
                    <div
                        css={[
                            tw`
                                flex
                                items-center
                                mb-6
                            `,
                        ]}
                    >
                        <div tw="flex-grow min-w-0">
                            <h2
                                css={[
                                    tw`
                                        font-medium
                                        text-[1.25rem]
                                        truncate
                                    `,
                                ]}
                            >
                                {title}
                            </h2>
                            {!!subtitle && (
                                <p
                                    css={[
                                        tw`
                                            text-[#59799C]
                                            text-[0.875rem]
                                            truncate
                                        `,
                                    ]}
                                >
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        <div>
                            <button
                                type="button"
                                css={[
                                    tw`
                                        block
                                        appearance-none
                                        [svg]:block
                                    `,
                                ]}
                                onClick={() => void close(AbortReason.CloseButton)}
                            >
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 32 32"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M8.47 8.47a.75.75 0 0 1 1.06 0L16 14.94l6.47-6.47a.75.75 0 1 1 1.06 1.06L17.06 16l6.47 6.47a.75.75 0 1 1-1.06 1.06L16 17.06l-6.47 6.47a.75.75 0 0 1-1.06-1.06L14.94 16 8.47 9.53a.75.75 0 0 1 0-1.06z"
                                        fill="#59799C"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </>
    )
}

Modal.displayName = 'Modal'