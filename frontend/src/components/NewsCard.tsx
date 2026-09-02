import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import type { NewsArticle } from '../types';
import { relativeTime } from '../lib/utils';

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  const { t } = useTranslation();

  return (
    <a
      href={article.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-surface border border-edge/12 rounded-xl overflow-hidden hover:border-brand/30 transition-all duration-150"
    >
      {/* Image */}
      {article.imageUrl && (
        <div className="h-40 bg-surface-2 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Source + time */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {article.source && (
            <span className="text-xs font-semibold text-brand">{article.source}</span>
          )}
          <span className="text-xs text-muted ml-auto">{relativeTime(article.publishedAt)}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-brand transition-colors">
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-xs text-muted line-clamp-2 mb-3">{article.summary}</p>
        )}

        {/* Read more */}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
          {t('news.readMore')} <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </a>
  );
}
