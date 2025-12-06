<div class="uo-table-wrapper">

    <table class="uo-table">

        {{-- COLGROUP dinamico --}}
        @if(isset($columns) && is_array($columns))
            <colgroup>
                @foreach($columns as $width)
                    <col style="width: {{ $width }}%;">
                @endforeach

                {{-- Colonna azioni --}}
                @if(!empty($actions))
                    <col style="width: 10%;">
                @endif
            </colgroup>
        @endif

        {{-- HEADER --}}
        <thead>
            <tr>
                @foreach($headers as $head)
                    <th>{{ $head }}</th>
                @endforeach

                @if(!empty($actions))
                    <th>Azioni</th>
                @endif
            </tr>
        </thead>

        {{-- BODY --}}
        <tbody>
            {{ $slot }}
        </tbody>

    </table>

</div>
