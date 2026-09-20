import { churchInfo } from "@/lib/church-data";

export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  href?: string;
  label: string;
  children?: NavChild[];
  /** Opens in a new tab with rel="noopener noreferrer". */
  external?: boolean;
}

export const visitHref = "/visit/";
export const giveHref =
  "https://tithe.ly/give_new/www/#/tithely/give-one-time/1285261";
export const espanolHref = "https://iglesiafresno.com";

/**
 * Single source of truth for the primary header/hero navigation.
 * Both SiteHeader and the homepage hero nav render from this list, so link
 * changes only need to happen here. Route structure matches fresnovictory.com.
 */
export const primaryNav: NavItem[] = [
  { href: "/salvation/", label: "Heaven" },
  { href: "/about-vbc/", label: "About VBC" },
  { href: "/meet-the-staff/", label: "Meet The Staff" },
  { href: "/sermons/", label: "Sermons" },
  { href: "/events/", label: "Events" },
  { href: espanolHref, label: "Español", external: true },
  { href: giveHref, label: "Give", external: true },
];

export const footerNav = {
  connect: [
    { href: "/#soul-winning", label: "Ministries" },
    { href: "/sermons/", label: "Sermons" },
    { external: true, href: churchInfo.facebook, label: "Facebook" },
    { external: true, href: churchInfo.youtube, label: "YouTube" },
    { external: true, href: giveHref, label: "Give" },
    {
      external: true,
      href: "https://portal.fresnovictory.com",
      label: "Portal",
    },
  ],
  more: [
    { href: "/salvation/", label: "Heaven" },
    { href: "/missions-conference/", label: "Missions Conference" },
    { href: "/privacy/", label: "Privacy" },
    { href: "/terms-of-use/", label: "Terms of Use" },
  ],
  visit: [
    { href: "/visit/", label: "Plan Your Visit" },
    { href: "/about-vbc/", label: "About VBC" },
    { href: "/meet-the-staff/", label: "Meet The Staff" },
    { href: "/events/", label: "Events" },
  ],
} as const;
