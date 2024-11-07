import { Fade as Hamburger } from "hamburger-react";
import React, { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BsThreeDots } from "react-icons/bs";
import { FaExternalLinkAlt, FaGithub } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useMedia } from "react-use";

const meta: {
    social: {
        [key: string]: string;
    };
    menu: {
        [key: string]: {
            link?: string;
            items?: {
                [key: string]: {
                    link: string;
                };
            };
        };
    };
} = {
    social: {
        github: "https://github.com/MPEGGroup/FileFormatConformance"
    },
    menu: {
        About: {
            link: "/about"
        },
        Contributing: {
            link: "https://github.com/MPEGGroup/FileFormatConformance/blob/main/CONTRIBUTING.md"
        },
        "Coverage Report": {
            link: "/coverage"
        }
    }
};

function Social({ className }: { className?: string }) {
    return (
        <div className={`flex flex-row gap-4 text-xl text-neutral-500 ${className}`}>
            <a
                aria-label="Check us out on GitHub"
                className="inline-flex items-center transition-all duration-200 hover:brightness-125"
                href={meta.social.github}
                rel="noreferrer"
                target="_blank"
            >
                <FaGithub />
            </a>
        </div>
    );
}

Social.defaultProps = {
    className: ""
};

function LinkWrapper({
    children,
    to,
    className
}: {
    children: React.ReactNode;
    to: string;
    className?: string;
}) {
    if (to.includes("//"))
        return (
            <a
                aria-label={`Link to ${children}`}
                className={className}
                href={to}
                rel="noreferrer"
                target="_blank"
            >
                {children}
            </a>
        );
    return (
        <Link aria-label={`Link to ${children}`} className={className} to={to}>
            {children}
        </Link>
    );
}

LinkWrapper.defaultProps = {
    className: ""
};

function MenuItem({
    children,
    link,
    dropdown
}: {
    children: React.ReactNode;
    link: string;
    dropdown?: {
        [key: string]: {
            link: string;
        };
    };
}) {
    const [open, setopen] = useState(false);

    if (!dropdown)
        return (
            <LinkWrapper
                className="inline-flex w-full max-w-xs cursor-pointer items-center gap-2 border-b-1 border-neutral-200 py-3 text-sm leading-6 transition-all duration-200 md:rounded-lg md:border-none md:px-3 md:py-2 md:hover:bg-neutral-200 md:hover:text-sky-600"
                to={link}
            >
                {children}
                {link.includes("//") && <FaExternalLinkAlt className="fill-neutral-400" size={9} />}
            </LinkWrapper>
        );
    return (
        <div
            className="w-full max-w-xs cursor-pointer border-b-1 border-neutral-200 py-3 text-sm leading-6"
            onClick={() => setopen((s) => !s)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    setopen((s) => !s);
                }
            }}
            role="menuitem"
            tabIndex={0}
        >
            <div className="flex flex-row items-center justify-between pr-2">
                <span className={open ? "text-sky-600" : ""}>{children}</span>
                <div className={`transition-transform ${open ? "rotate-45" : "rotate-0"}`}>
                    <AiOutlinePlus />
                </div>
            </div>
            {open && (
                <div className="flex flex-col">
                    {Object.keys(dropdown).map((item) => (
                        <LinkWrapper
                            key={item}
                            className="inline-flex items-center gap-2 pl-3 text-sm leading-8 first:mt-2"
                            to={dropdown[item].link}
                        >
                            {item}
                            {dropdown[item].link.includes("//") && (
                                <FaExternalLinkAlt className="fill-neutral-400" size={9} />
                            )}
                        </LinkWrapper>
                    ))}
                </div>
            )}
        </div>
    );
}

MenuItem.defaultProps = {
    dropdown: undefined
};

function Dropdown({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`invisible absolute right-0 top-12 z-30 float-left flex min-w-max flex-col rounded-xl border-1 border-neutral-700 bg-paper p-3 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 lg:top-14 ${className}`}
        >
            {children}
        </div>
    );
}

Dropdown.defaultProps = {
    className: ""
};

function MenuItemSmall({
    children,
    link,
    dropdown
}: {
    children: React.ReactNode;
    link: string;
    dropdown?: {
        [key: string]: {
            link: string;
        };
    };
}) {
    if (!dropdown)
        return (
            <LinkWrapper
                aria-label={`Link to ${children}`}
                className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-all duration-200 hover:text-sky-600"
                to={link}
            >
                {children}
            </LinkWrapper>
        );
    return (
        <div className="group relative inline-flex text-sm font-medium">
            <div className="inline-flex cursor-pointer items-center gap-1 transition-all duration-200 group-hover:brightness-50">
                {children}
                <FiChevronDown />
            </div>
            <Dropdown>
                {Object.keys(dropdown).map((item) => (
                    <MenuItem key={item} link={dropdown[item].link}>
                        {item}
                    </MenuItem>
                ))}
            </Dropdown>
        </div>
    );
}

MenuItemSmall.defaultProps = {
    dropdown: undefined
};

export default function NavigationBar() {
    const [open, setopen] = useState(false);
    const mobile = useMedia("(max-width: 640px)");

    useEffect(() => {
        window.scrollTo(0, 0);
        document.body.style.overflow = open ? "hidden" : "auto";
        return () => {};
    }, [open]);

    useEffect(() => {
        if (!mobile) setopen(false);
        return () => {};
    }, [mobile]);

    return (
        <header className="w-full bg-transparent text-neutral-800">
            <nav className="flex w-full max-w-[88rem] flex-row items-stretch justify-between border-b-1 border-neutral-200 xs:px-4 md:px-8 xl:mx-auto xl:border-0">
                <LinkWrapper className="transition-all duration-200 hover:brightness-150" to="/">
                    <span className="my-4 flex flex-row flex-wrap items-center text-lg font-medium leading-normal max-md:ml-3 xl:my-6">
                        <span className="mr-1 whitespace-nowrap font-bold max-xs:text-sm">
                            File Format
                        </span>
                        <span className="whitespace-nowrap font-light max-xs:text-sm">
                            Conformance Framework
                        </span>
                    </span>
                </LinkWrapper>
                <div className="hidden flex-row items-stretch gap-6 md:flex">
                    {Object.keys(meta.menu).map((item) => (
                        <MenuItemSmall
                            key={item}
                            dropdown={meta.menu[item]?.items}
                            link={meta.menu[item]?.link || "#"}
                        >
                            {item}
                        </MenuItemSmall>
                    ))}
                    <div className="group relative inline-flex cursor-pointer items-center lg:hidden">
                        <span className="transition-all duration-200 group-hover:brightness-50">
                            <BsThreeDots size={18} />
                        </span>
                        <Dropdown className="gap-3">
                            <div className="inline-flex items-center justify-center px-2">
                                <Social />
                            </div>
                        </Dropdown>
                    </div>
                    <Social className="hidden items-stretch lg:flex" />
                </div>
                <div className="inline-flex items-center md:hidden">
                    <Hamburger
                        label={open ? "Close Menu" : "Open Menu"}
                        onToggle={(toggled) => setopen(toggled)}
                        rounded
                        size={18}
                        toggled={open}
                    />
                </div>
            </nav>
            <div
                className={`fixed left-0 z-30 flex h-screen w-screen flex-col items-center bg-paper px-12 pt-4 transition-all ${
                    open ? "" : "invisible opacity-0"
                }`}
            >
                {Object.keys(meta.menu).map((item) => (
                    <MenuItem
                        key={item}
                        dropdown={meta.menu[item]?.items}
                        link={meta.menu[item]?.link || "#"}
                    >
                        {item}
                    </MenuItem>
                ))}
                <Social className="mt-6" />
            </div>
        </header>
    );
}
