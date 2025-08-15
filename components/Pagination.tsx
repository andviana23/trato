"use client";

import React from "react";
import { HStack, IconButton, Button, Text } from "@chakra-ui/react";
import { FiChevronsLeft, FiChevronLeft, FiChevronRight, FiChevronsRight } from "react-icons/fi";

export interface PaginationProps {
  total: number; // total de páginas (>= 1)
  page: number; // página atual (1-based)
  onChange: (page: number) => void;
  showControls?: boolean;
  siblingCount?: number; // quantos vizinhos mostrar ao redor da página atual
  boundaryCount?: number; // quantas páginas mostrar nas extremidades
}

function generatePageRange(
  total: number,
  current: number,
  siblingCount: number,
  boundaryCount: number
): (number | "...")[] {
  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const totalNumbers = siblingCount * 2 + 1;
  const totalBlocks = totalNumbers + boundaryCount * 2 + 2; // +2 para as duas elipses

  if (total <= totalBlocks) {
    return range(1, total);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);

  const showLeftEllipsis = leftSibling > boundaryCount + 2;
  const showRightEllipsis = rightSibling < total - (boundaryCount + 1);

  const leftBoundary = range(1, boundaryCount);
  const rightBoundary = range(total - boundaryCount + 1, total);
  const middle = range(leftSibling, rightSibling);

  if (!showLeftEllipsis && showRightEllipsis) {
    const left = range(1, boundaryCount + totalNumbers + 1);
    return [...left, "...", ...rightBoundary];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const right = range(total - (boundaryCount + totalNumbers), total);
    return [...leftBoundary, "...", ...right];
  }

  return [...leftBoundary, "...", ...middle, "...", ...rightBoundary];
}

export default function Pagination({
  total,
  page,
  onChange,
  showControls = true,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationProps) {
  const current = Math.min(Math.max(page, 1), Math.max(total, 1));
  const pages = React.useMemo(
    () => generatePageRange(Math.max(total, 1), current, siblingCount, boundaryCount),
    [total, current, siblingCount, boundaryCount]
  );

  const goTo = (p: number) => {
    const next = Math.min(Math.max(p, 1), Math.max(total, 1));
    if (next !== current) onChange(next);
  };

  return (
    <HStack gap={1}>
      {showControls && (
        <>
          <IconButton
            aria-label="Primeira página"
            size="sm"
            variant="ghost"
            onClick={() => goTo(1)}
            disabled={current === 1}
          >
            <FiChevronsLeft />
          </IconButton>
          <IconButton
            aria-label="Página anterior"
            size="sm"
            variant="ghost"
            onClick={() => goTo(current - 1)}
            disabled={current === 1}
          >
            <FiChevronLeft />
          </IconButton>
        </>
      )}

      {pages.map((p, idx) =>
        p === "..." ? (
          <Text key={`dots-${idx}`} px={2} userSelect="none">
            ...
          </Text>
        ) : (
          <Button
            key={p}
            size="sm"
            variant={p === current ? "solid" : "ghost"}
            colorScheme={p === current ? "blue" : undefined}
            onClick={() => goTo(p)}
          >
            {p}
          </Button>
        )
      )}

      {showControls && (
        <>
          <IconButton
            aria-label="Próxima página"
            size="sm"
            variant="ghost"
            onClick={() => goTo(current + 1)}
            disabled={current === Math.max(total, 1)}
          >
            <FiChevronRight />
          </IconButton>
          <IconButton
            aria-label="Última página"
            size="sm"
            variant="ghost"
            onClick={() => goTo(total)}
            disabled={current === Math.max(total, 1)}
          >
            <FiChevronsRight />
          </IconButton>
        </>
      )}
    </HStack>
  );
}


