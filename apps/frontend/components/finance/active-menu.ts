export type FinanceMenuChild = { title: string; href: string; match?: string };

export type FinanceMenuItem = {
  title: string;
  href?: string;
  match?: string;
  icon?: unknown;
  children?: FinanceMenuChild[];
};

export type ActiveMenu = { active: boolean; activeChildHref: string | null };

function boundaryMatch(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function prefixMatch(pathname: string, match: string) {
  return pathname === match || pathname.startsWith(match);
}

function childMatches(pathname: string, child: FinanceMenuChild) {
  return (
    boundaryMatch(pathname, child.href) ||
    (child.match !== undefined && prefixMatch(pathname, child.match))
  );
}

export function resolveActiveMenu(
  pathname: string,
  item: FinanceMenuItem,
): ActiveMenu {
  if (item.href) {
    const active =
      boundaryMatch(pathname, item.href) ||
      (item.match !== undefined && prefixMatch(pathname, item.match));
    return { active, activeChildHref: null };
  }

  const children = item.children ?? [];
  const exact = children.find((child) => child.href === pathname);
  if (exact) return { active: true, activeChildHref: exact.href };

  const matching = children.filter((child) => childMatches(pathname, child));
  if (matching.length === 0) return { active: false, activeChildHref: null };

  const shallowest = matching.reduce((best, child) =>
    child.href.length < best.href.length ? child : best,
  );
  return { active: true, activeChildHref: shallowest.href };
}
