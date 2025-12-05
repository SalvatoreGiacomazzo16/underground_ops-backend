{{-- File: resources/views/components/pagination.blade.php --}}

@props(['paginator'])

@if ($paginator instanceof \Illuminate\Contracts\Pagination\Paginator && $paginator->hasPages())
    <nav class="uo-pagination-wrapper" role="navigation" aria-label="Pagination Navigation">
        <ul class="uo-pagination">

            {{-- PREVIOUS --}}
            @if ($paginator->onFirstPage())
                <li class="page-item disabled" aria-disabled="true">
                    <span class="page-link uo-link-neon-default">&lsaquo;</span>
                </li>
            @else
                <li class="page-item">
                    <a class="page-link uo-link-neon-default"
                       href="{{ $paginator->previousPageUrl() }}"
                       rel="prev">
                        &lsaquo;
                    </a>
                </li>
            @endif

            {{-- NUMERI DI PAGINA (senza elements()) --}}
            @for ($page = 1; $page <= $paginator->lastPage(); $page++)
                @if ($page == $paginator->currentPage())
                    <li class="page-item active" aria-current="page">
                        <span class="page-link uo-link-neon-active">{{ $page }}</span>
                    </li>
                @else
                    <li class="page-item">
                        <a class="page-link uo-link-neon-default"
                           href="{{ $paginator->url($page) }}">
                            {{ $page }}
                        </a>
                    </li>
                @endif
            @endfor

            {{-- NEXT --}}
            @if ($paginator->hasMorePages())
                <li class="page-item">
                    <a class="page-link uo-link-neon-default"
                       href="{{ $paginator->nextPageUrl() }}"
                       rel="next">
                        &rsaquo;
                    </a>
                </li>
            @else
                <li class="page-item disabled" aria-disabled="true">
                    <span class="page-link uo-link-neon-default">&rsaquo;</span>
                </li>
            @endif

        </ul>
    </nav>
@endif
