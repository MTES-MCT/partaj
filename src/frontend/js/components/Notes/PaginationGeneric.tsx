import React from "react";


export interface PaginationGenericProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
}

export function PaginationGeneric({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationGenericProps
) {
  const goTo = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pagesToShow = () => {
    const pages = [];

    // Exemple simple : 1, 2, 3, …, last-1, last
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);

      if (currentPage > 4) pages.push("…");

      if (currentPage > 3 && currentPage < totalPages - 2) {
        pages.push(currentPage);
      }

      if (currentPage < totalPages - 3) pages.push("…");

      pages.push(totalPages - 1, totalPages);
    }

    return pages;
  };

  return (
    <nav role="navigation" className="fr-pagination" aria-label="pagination">
      <ul className="fr-pagination__list flex space-x-2 items-center">

        {/* Première page */}
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--first pagination__link"
            title="Première page"
            disabled={currentPage === 1}
            onClick={() => goTo(1)}
          >
            Première page
          </button>
        </li>

        {/* Page précédente */}
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
            title="Page précédente"
            disabled={currentPage === 1}
            onClick={() => goTo(currentPage - 1)}
          >
            Page précédente
          </button>
        </li>

        {/* Pages */}
        {pagesToShow().map((p, index) => (
          <li key={index}>
            {p === "…" ? (
              <span className="fr-pagination__link fr-hidden fr-unhidden-lg">
                …
              </span>
            ) : (
              <button
                className={`fr-pagination__link ${p === currentPage ? "fr-pagination__link--current" : ""
                  }`}
                aria-current={p === currentPage ? "page" : undefined}
                onClick={() => typeof p === "number" && goTo(p)}
              >
                {p}
              </button>
            )}
          </li>
        ))}

        {/* Page suivante */}
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
            title="Page suivante"
            disabled={currentPage === totalPages}
            onClick={() => goTo(currentPage + 1)}
          >
            Page suivante
          </button>
        </li>

        {/* Dernière page */}
        <li>
          <button
            className="fr-pagination__link fr-pagination__link--last"
            title="Dernière page"
            disabled={currentPage === totalPages}
            onClick={() => goTo(totalPages)}
          >
            Dernière page
          </button>
        </li>
      </ul>
    </nav>
  );
}
