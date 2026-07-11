interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "E-mail", href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-polis-ink-soft">Compartilhar:</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-polis-ink underline decoration-polis-gold-muted decoration-2 underline-offset-4 hover:text-polis-gold-ink"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
