import { FiInbox } from 'react-icons/fi';

export default function EmptyState({
  icon: Icon = FiInbox,
  title = 'No data found',
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-gray-100 dark:bg-dark-700 mb-4">
        <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">{description}</p>
      )}
      {action && action}
    </div>
  );
}
