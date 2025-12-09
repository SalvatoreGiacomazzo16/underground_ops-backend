@props(['model', 'routePrefix'])

<a href="{{ route('admin.' . $routePrefix . '.edit', $model) }}"
   class="uo-action-btn uo-edit">
    ✏️ <span>Edit</span>
</a>

<form action="{{ route('admin.' . $routePrefix . '.destroy', $model) }}"
      method="POST" class="d-inline">
    @csrf
    @method('DELETE')
    <button class="uo-action-btn uo-delete">
        🗑️ <span>Delete</span>
    </button>
</form>
