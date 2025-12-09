<div class="uo-table-wrapper {{ $wrapperClass ?? '' }}" id="{{ $wrapperId ?? '' }}">
    <table class="uo-table {{ $tableClass ?? '' }}">

        @if(!empty($columns) && is_array($columns))
            <colgroup>
                @foreach($columns as $width)
                    <col style="width: {{ $width }}%;">
                @endforeach

                @if(!empty($actions))
                    <col style="width: {{ $actionsWidth ?? 10 }}%;">
                @endif
            </colgroup>
        @endif

        <thead>
            <tr>
                @foreach($headers as $head)
                    <th>{{ $head }}</th>
                @endforeach

                @if(!empty($actions))
                    <th class="text-end">Azioni</th>
                @endif
            </tr>
        </thead>

        <tbody>
            {{ $slot }}
        </tbody>

    </table>
</div>
