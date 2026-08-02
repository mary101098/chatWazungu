import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function Logo({ size = 'md', to = '/' }: { size?: 'sm' | 'md' | 'lg'; to?: string | null }) {
  const sizes = {
    sm: { box: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-base' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-lg' },
    lg: { box: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-xl' },
  };
  const s = sizes[size];

  const content = (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm`}>
        <MessageCircle className={s.icon} />
      </div>
      <span className={`${s.text} font-extrabold tracking-tight text-ink`}>
        Chat <span className="text-primary-600">Wazungu</span>
      </span>
    </div>
  );

  if (to === null) return content;
  return <Link to={to}>{content}</Link>;
}
