import gsap from 'gsap'
import { HTMLAttributes, ReactNode, useEffect, useRef } from 'react'
import useGlobalKeyDownEffect from 'streamr-ui/hooks/useGlobalKeyDownEffect'
import useOnMouseDownOutsideEffect from 'streamr-ui/hooks/useOnMouseDownOutsideEffect'
import tw, { css } from 'twin.macro'

export enum AbortReason {
    CloseButton,
    Backdrop,
    Escape,
}

export interface Props {
    children?: ReactNode
    title?: string
    subtitle?: string
    onAbort?: (reason?: any) => void
    onBeforeAbort?: (reason?: any) => boolean | void
}

export default function Modal({
    title = 'Untitled dialog',
    subtitle,
    children,
    onAbort,
    onBeforeAbort,
}: Props) {
    const wigglyRef = useRef<HTMLDivElement>(null)

    const tweenRef = useRef<ReturnType<typeof gsap.to>>()

    function wiggle() {
        const { current: wiggly } = wigglyRef

        tweenRef.current?.kill()

        tweenRef.current = gsap.to(
            {},
            {
                duration: 0.75,
                onUpdate() {
                    const { current: wiggly } = wigglyRef

                    if (!wiggly) {
                        return
                    }

                    const p = this.progress()

                    const intensity = (1 + Math.sin((p * 2 - 0.5) * Math.PI)) * 0.5

                    const wave = 5 * Math.sin(6 * p * Math.PI)

                    wiggly.style.transform = `rotate(${intensity * wave}deg)`
                },
            }
        )
    }

    useEffect(
        () => () => {
            tweenRef.current?.kill()
        },
        []
    )

    function close(reason?: any) {
        if (onBeforeAbort?.(reason) === false) {
            wiggle()

            return
        }

        onAbort?.(reason)
    }

    useGlobalKeyDownEffect((e) => {
        if (e.key === 'Escape') {
            close(AbortReason.Escape)
        }
    })

    const modalRef = useOnMouseDownOutsideEffect(() => void close(AbortReason.Backdrop))

    return (
        <div
            css={tw`
                bg-[rgba(0, 0, 0, 0.3)]
                backdrop-blur
                fixed
                w-full
                h-full
                top-0
                left-0
                overflow-auto
            `}
        >
            <div
                css={tw`
                    flex
                    items-center
                    justify-center
                    h-full
                    relative
                `}
            >
                <div
                    css={tw`
                        max-h-full
                        overflow-visible
                    `}
                >
                    <div
                        css={tw`
                            py-10
                            md:py-16
                        `}
                    >
                        <div
                            ref={modalRef}
                            css={tw`
                                pointer-events-auto
                                max-w-[560px]
                                w-[90vw]
                            `}
                        >
                            <div css={tw`animate-[bringIn 150ms ease-in-out 1]`}>
                                <div
                                    ref={wigglyRef}
                                    css={tw`
                                        bg-[white]
                                        p-8
                                        pt-7
                                        md:p-12
                                        md:pt-10
                                        rounded-[20px]
                                        shadow-lg
                                    `}
                                >
                                    <div
                                        css={tw`
                                            flex
                                            items-center
                                            mb-6
                                        `}
                                    >
                                        <div
                                            css={tw`
                                                grow
                                                min-w-0
                                            `}
                                        >
                                            <h2
                                                css={tw`
                                                    font-medium
                                                    text-[1.25rem]
                                                    truncate
                                                `}
                                            >
                                                {title}
                                            </h2>
                                            {!!subtitle && (
                                                <p
                                                    css={tw`
                                                        text-[#59799C]
                                                        text-[0.875rem]
                                                        truncate
                                                    `}
                                                >
                                                    {subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <button
                                                type="button"
                                                css={tw`
                                                    block
                                                    appearance-none
                                                    [svg]:block
                                                `}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
