export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  href?: string;
  label: string;
  children?: NavChild[];
}

/** Primary navigation matching fresnovictory.com route structure. */
export const primaryNav: NavItem[] = [
  { href: "/salvation/", label: "Heaven" },
  { href: "/about-vbc/", label: "About VBC" },
  { href: "/meet-the-staff/", label: "Meet The Staff" },
  { href: "/sermons/", label: "Sermons" },
];

export const visitHref = "/visit/";
export const giveHref =
  "https://tithe.ly/give_new/www/#/tithely/give-one-time/1285261";

export const footerNav = {
  connect: [
    { href: "/#ministries", label: "Ministries" },
    { href: "/sermons/", label: "Sermons" },
    { href: "/media/", label: "Media" },
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
