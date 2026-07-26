import type { RowData, Table } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  Play,
  User,
} from "lucide-react";

import { formatSermonDate } from "@/lib/sermons";
import type { Sermon } from "@/lib/sermons";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

const PAGE_SIZE = 10;
const MAX_PAGE_BUTTONS = 7;

const ELLIPSIS_START = "start-ellipsis";
const ELLIPSIS_END = "end-ellipsis";

type PageItem = number | typeof ELLIPSIS_START | typeof ELLIPSIS_END;

const getPageItems = (pageCount: number, pageIndex: number): PageItem[] => {
  if (pageCount <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const windowStart = Math.max(1, pageIndex - 1);
  const windowEnd = Math.min(pageCount - 2, pageIndex + 1);
  const middlePages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, index) => windowStart + index
  );

  return [
    0,
    ...(windowStart > 1 ? [ELLIPSIS_START] : []),
    ...middlePages,
    ...(windowEnd < pageCount - 2 ? [ELLIPSIS_END] : []),
    pageCount - 1,
  ];
};

interface SermonsTableProps {
  sermons: Sermon[];
}

const columnHelper = createColumnHelper<Sermon>();

const columns = [
  columnHelper.accessor("title", {
    cell: (info) => {
      const sermon = info.row.original;

      return (
        <div className="flex min-w-52 items-center gap-4 md:min-w-64">
          <a
            aria-label={`Watch "${sermon.title}" on YouTube`}
            className="group/thumb relative hidden shrink-0 overflow-hidden rounded-lg ring-1 ring-border transition-shadow hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 sm:block"
            href={sermon.youtubeUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <img
              alt=""
              aria-hidden="true"
              className="aspect-video w-28 object-cover transition-transform duration-300 group-hover/thumb:scale-105 md:w-32"
              decoding="async"
              height={72}
              loading="lazy"
              src={sermon.thumbnailUrl}
              width={128}
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover/thumb:bg-foreground/40"
            >
              <Play className="size-5 fill-white text-white opacity-0 transition-opacity group-hover/thumb:opacity-100" />
            </span>
          </a>
          <div className="min-w-0">
            <p className="line-clamp-2 font-display text-[0.95rem] font-semibold leading-snug text-foreground">
              {info.getValue()}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {formatSermonDate(sermon.publishedAt)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground md:hidden">
              <User aria-hidden="true" className="size-3.5" />
              {sermon.speaker}
            </p>
          </div>
        </div>
      );
    },
    header: "Message",
  }),
  columnHelper.accessor("speaker", {
    cell: (info) => (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium whitespace-nowrap text-secondary-foreground">
        <User aria-hidden="true" className="size-3.5" />
        {info.getValue()}
      </span>
    ),
    header: "Speaker",
    meta: { className: "hidden w-44 md:table-cell" },
  }),
  columnHelper.display({
    cell: (info) => {
      const sermon = info.row.original;

      return (
        <a
          aria-label={`Watch "${sermon.title}" on YouTube`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-secondary px-3 text-sm font-medium whitespace-nowrap text-secondary-foreground transition-all hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-outline/50 sm:px-4"
          href={sermon.youtubeUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Play aria-hidden="true" className="size-3.5 fill-current" />
          <span className="hidden sm:inline">Watch</span>
        </a>
      );
    },
    header: () => <span className="sr-only">Watch</span>,
    id: "watch",
    meta: { className: "w-20 whitespace-nowrap text-right sm:w-28" },
  }),
];

const paginationButtonBaseClass =
  "inline-flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-outline/50";
const paginationButtonIdleClass =
  "border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground";
const paginationButtonActiveClass =
  "border border-primary bg-primary text-primary-foreground";
const paginationButtonDisabledClass = "pointer-events-none opacity-40";

const EmptyState = () => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <MonitorPlay aria-hidden="true" className="size-6" />
    </span>
    <p className="font-display text-lg font-semibold text-foreground">
      No sermons yet
    </p>
    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
      Sermon archives will appear here after the next sync. Check back soon.
    </p>
  </div>
);

interface PageNumberButtonProps {
  isActive: boolean;
  onSelect: (page: number) => void;
  page: number;
}

const PageNumberButton = ({
  isActive,
  onSelect,
  page,
}: PageNumberButtonProps) => (
  <button
    aria-current={isActive ? "page" : undefined}
    aria-label={`Page ${page + 1}`}
    className={`${paginationButtonBaseClass} hidden sm:inline-flex ${isActive ? paginationButtonActiveClass : paginationButtonIdleClass}`}
    onClick={() => onSelect(page)}
    type="button"
  >
    {page + 1}
  </button>
);

interface PaginationBarProps {
  onPageChange: (page: number) => void;
  table: Table<Sermon>;
  totalRows: number;
}

const PaginationBar = ({
  onPageChange,
  table,
  totalRows,
}: PaginationBarProps) => {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const firstRowNumber = pageIndex * pageSize + 1;
  const lastRowNumber = Math.min(firstRowNumber + pageSize - 1, totalRows);
  const pageItems = getPageItems(pageCount, pageIndex);
  const canGoBack = table.getCanPreviousPage();
  const canGoForward = table.getCanNextPage();

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {firstRowNumber}–{lastRowNumber}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalRows}</span>{" "}
        messages
      </p>

      {pageCount > 1 && (
        <nav aria-label="Sermon pages" className="flex items-center gap-1">
          <button
            aria-label="Previous page"
            className={`${paginationButtonBaseClass} ${paginationButtonIdleClass} ${canGoBack ? "" : paginationButtonDisabledClass}`}
            disabled={!canGoBack}
            onClick={() => onPageChange(pageIndex - 1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>

          <span
            aria-hidden="true"
            className="px-2 text-xs text-muted-foreground sm:hidden"
          >
            {pageIndex + 1} / {pageCount}
          </span>

          {pageItems.map((item) =>
            typeof item === "number" ? (
              <PageNumberButton
                isActive={item === pageIndex}
                key={item}
                onSelect={onPageChange}
                page={item}
              />
            ) : (
              <span
                aria-hidden="true"
                className="hidden size-9 items-center justify-center text-muted-foreground sm:inline-flex"
                key={item}
              >
                …
              </span>
            )
          )}

          <button
            aria-label="Next page"
            className={`${paginationButtonBaseClass} ${paginationButtonIdleClass} ${canGoForward ? "" : paginationButtonDisabledClass}`}
            disabled={!canGoForward}
            onClick={() => onPageChange(pageIndex + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default function SermonsTable({ sermons }: SermonsTableProps) {
  const table = useReactTable({
    columns,
    data: sermons,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (sermon) => sermon.youtubeId,
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  if (sermons.length === 0) {
    return <EmptyState />;
  }

  const goToPage = (index: number) => {
    table.setPageIndex(index);
  };

  return (
    <div className="animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full table-fixed caption-bottom text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                className="border-b border-border bg-muted/50"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    className={`h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground ${header.column.columnDef.meta?.className ?? ""}`}
                    key={header.id}
                    scope="col"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/30"
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    className={`px-4 py-3 align-middle ${cell.column.columnDef.meta?.className ?? ""}`}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar
        onPageChange={goToPage}
        table={table}
        totalRows={sermons.length}
      />
    </div>
  );
}
