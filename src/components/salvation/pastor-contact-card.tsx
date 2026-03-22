import { Mail, Phone, UserRound } from "lucide-react";

interface PastorContactCardProps {
  className?: string;
}

export const PastorContactCard = ({
  className = "",
}: PastorContactCardProps) => (
  <section
    className={`rounded-[2rem] border border-white/45 bg-white/90 p-5 text-left shadow-[0_24px_80px_rgba(19,44,38,0.16)] backdrop-blur ${className}`.trim()}
  >
    <div className="flex items-center gap-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1b4332,#2d6a4f)] text-white shadow-lg">
        <UserRound className="size-8" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3f5d56]">
          Senior Pastor
        </p>
        <h3 className="mt-1 text-xl font-semibold text-[#17302b]">
          Ryan Willis
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[#536963]">
          Pastor photo and final contact details will be confirmed before
          launch.
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-3 text-sm text-[#1d3933] sm:grid-cols-2">
      <a
        className="flex items-center gap-3 rounded-2xl border border-[#dbe7e2] bg-[#f5f9f7] px-4 py-3 transition hover:border-[#9bc3b2] hover:bg-white"
        href="mailto:ryan.willis@fresnovictory.com?subject=Salvation%20Follow-Up"
      >
        <Mail className="size-4 text-[#2d6a4f]" />
        <span>Email Pastor Ryan</span>
      </a>
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#dbe7e2] bg-[#fbfdfc] px-4 py-3 text-[#536963]">
        <Phone className="size-4 text-[#2d6a4f]" />
        <span>Phone placeholder</span>
      </div>
    </div>
  </section>
);
