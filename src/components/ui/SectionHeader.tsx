import { IconBadge } from './Card';

/** Section header with icon badge, uppercase label, and count pill */
export function SectionHeader({ color, icon, title, count }: {
  color: string;
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <IconBadge color={color} icon={icon} />
      <span className="text-[12px] font-semibold text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)] uppercase tracking-[0.04em]">
        {title}
      </span>
      {count !== undefined && (
        <span
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
          style={{ background: `${color}1F`, color }}
        >
          {count}
        </span>
      )}
    </div>
  );
}
