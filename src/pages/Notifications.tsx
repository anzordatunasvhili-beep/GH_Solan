import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, EmptyState } from '../components/ui';
import { relativeTime } from '../lib/format';
import { Bell, CheckCheck } from 'lucide-react';

export function Notifications() {
  const navigate = useNavigate();
  const { notifications, currentRole, markAllRead, markNotificationRead } = useStore();
  const mine = notifications.filter((n) => n.audience === currentRole);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-white/45">{mine.filter((n) => !n.read).length} unread</p>
        </div>
        {mine.length > 0 && <button onClick={markAllRead} className="btn-ghost"><CheckCheck size={16} /> Mark all read</button>}
      </div>
      {mine.length === 0 ? (
        <EmptyState icon={<Bell size={36} />} title="No notifications" body="Actions on your projects will show up here." />
      ) : (
        <div className="space-y-2">
          {mine.map((n) => (
            <Card key={n.id} className={`cursor-pointer p-4 ${!n.read ? 'border-sol-purple/30' : ''}`}>
              <div onClick={() => { markNotificationRead(n.id); navigate(n.link); }} className="flex items-start gap-3">
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sol-purple" />}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{n.title}</span>
                    <span className="text-xs text-white/35">{relativeTime(n.at)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-white/55">{n.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
