import { Layer, TooltipHost } from "@fluentui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { HTMLAttributes, memo, useEffect, useRef } from "react";
import styled from "styled-components";
import ToolbarButton, { ToolbarButtonItem } from "./toolbar-button";
import ToolbarToggleButton, { ToolbarToggleButtonItem } from "./toolbar-toggle-button";
import Toolbar, { ToolbarProps, ToolbarSplitter, useHandlers } from ".";


const ToolbarItemContainerElement = styled.div<{ split: boolean }>`
    display: inline-flex;
    flex-direction: row;
    user-select: none;
    outline: none;
    width: ${({ split }) => split ? 'calc(var(--height) + 10px)' : 'var(--height)'};
    height: var(--height);
    overflow: hidden;
    color: #AEAEAE;
    > svg {
        flex-grow: 0;
        flex-shrink: 0;
        width: var(--icon-size);
        height: var(--icon-size);
        margin: calc((var(--height) - var(--icon-size)) / 2);
        margin-right: ${({ split }) => split ? 'calc((var(--height) - var(--icon-size)) / 4)' : ''};
        transition: text-shadow 100ms;
    }
    --shadow-color: #0F172A55;
    &[aria-disabled=true] {
        cursor: default;
        > * {
            opacity: 0.33;
        }
    }
    &[aria-disabled=false] {
        cursor: pointer;
        :hover, :focus, &.open {
            background-image: linear-gradient(#FFFFFFCC, #FEFEFECC);
            color: #0F172A;
            &.split * svg {
                pointer-events: none;
                transform: translate(-50%, -20%);
            }
            & svg {
                text-shadow: 0 0 1.5px var(--shadow-color);
            }
        }
    }
    transition: color 100ms, background-image 100ms;
`;

const ToolbarSplit = styled.div<{ open: boolean }>`
    flex-grow: 1;
    flex-shrink: 1;
    display: inline-block;
    height: var(--height);
    position: relative;
    margin-right: 4px;
    > svg {
        position: absolute;
        width: calc(var(--icon-size) * 0.6);
        height: calc(var(--icon-size) * 0.6);
        left: 50%;
        top: 50%;
        transform: translate(-50%, ${({ open }) => open ? '-20%' : '-50%'});
        transition: transform 120ms;
    }
    :hover > svg, :focus > svg {
        transform: translate(-50%, -20%);
    }
`;

export interface IToolbarItem {
    key: string;
    icon: (props: React.ComponentProps<'svg'> & {
        title?: string;
        titleId?: string;
    }) => JSX.Element;
    label: string;
    /** @default false */
    disabled?: boolean;
    menu?: ToolbarProps;
}

export const ToolbarItemSplitter = '-';

export type ToolbarItemProps = (
    | ToolbarButtonItem
    | ToolbarToggleButtonItem
    | typeof ToolbarItemSplitter
);

export interface IToolbarProps<P extends Exclude<ToolbarItemProps, typeof ToolbarItemSplitter> = Exclude<ToolbarItemProps, typeof ToolbarItemSplitter>> {
    item: P;
    styles?: ToolbarProps['styles'];
    layerId: string;
    openedKey: string | null;
    setOpenedKey: (key: string | null) => void;
}

export const ToolbarItemContainer = memo<{
    props: IToolbarProps;
    handlers: ReturnType<typeof useHandlers> | null;
    children: JSX.Element;
} & HTMLAttributes<HTMLDivElement>>(function ToolbarItemContainer (
    {
        props: {
            item: { key, label, disabled = false, menu, icon: _, ...item },
            styles, layerId, openedKey, setOpenedKey,
        },
        handlers,
        children,
        ...props
    }
) {
    const splitOnly = Boolean(menu) && handlers === null;

    const opened = Boolean(menu) && key === openedKey && !disabled;
    const openedRef = useRef(opened);
    openedRef.current = opened;

    const splitHandlers = useHandlers(() => {
        setOpenedKey(opened ? null : key);
    }, disabled ?? false, [' ']);

    useEffect(() => {
        if (opened) {
            requestAnimationFrame(() => {
                const firstOption = document.getElementById(layerId)?.querySelector('*[role=button]');
                if (firstOption instanceof HTMLElement) {
                    // set tab position
                    firstOption.focus();
                    firstOption.blur();
                }
            });
        }
    }, [opened, layerId]);

    useEffect(() => {
        if (opened) {
            const close = (e?: unknown) => {
                if (!openedRef.current) {
                    return;
                }
                if (!e) {
                    setOpenedKey(null);
                } else if (e instanceof KeyboardEvent && e.key === 'Escape') {
                    setOpenedKey(null);
                } else if (e instanceof MouseEvent) {
                    setTimeout(() => {
                        if (openedRef.current) {
                            setOpenedKey(null);
                        }
                    }, 100);
                }
            };

            document.addEventListener('mousedown', close);
            document.addEventListener('keydown', close);

            return () => {
                document.removeEventListener('mousedown', close);
                document.removeEventListener('keydown', close);
            };
        }
    }, [setOpenedKey, opened]);

    return (
        <TooltipHost content={label}>
            <ToolbarItemContainerElement
                role="button" tabIndex={disabled ? undefined : 0} aria-label={label} aria-disabled={disabled ?? false}
                split={Boolean(menu)}
                style={styles?.item}
                className={opened ? 'open' : undefined}
                aria-haspopup={splitOnly ? 'menu' : 'false'}
                {...(splitOnly ? splitHandlers : handlers)}
                {...props}
            >
                {children}
                {menu && (
                    splitOnly ? (
                        <ToolbarSplit
                            open={opened}
                            {...splitHandlers}
                        >
                            <ChevronDownIcon style={styles?.splitIcon} />
                        </ToolbarSplit>
                    ) : (
                        <ToolbarSplit
                            role="button" tabIndex={disabled ? undefined : 0} aria-label={label} aria-disabled={disabled} aria-haspopup="menu"
                            open={opened}
                            {...splitHandlers}
                        >
                            <ChevronDownIcon style={styles?.splitIcon} />
                        </ToolbarSplit>
                    )
                )}
            </ToolbarItemContainerElement>
            {menu && opened && (
                <Layer hostId={layerId}>
                    <Toolbar {...menu} />
                </Layer>
            )}
        </TooltipHost>
    );
});

const ToolbarItem = memo<{
    item: ToolbarItemProps;
    styles?: ToolbarProps['styles'];
    layerId: string;
    openedKey: string | null;
    setOpenedKey: (key: string | null) => void;
}>(function ToolbarItem ({ item, styles, layerId, openedKey, setOpenedKey }) {
    if (item === ToolbarItemSplitter) {
        return  <ToolbarSplitter />;
    }
    if ('checked' in item) {
        return <ToolbarToggleButton item={item} styles={styles} layerId={layerId} openedKey={openedKey} setOpenedKey={setOpenedKey} />;
    }
    return <ToolbarButton item={item} styles={styles} layerId={layerId} openedKey={openedKey} setOpenedKey={setOpenedKey} />;
});


export default ToolbarItem;
