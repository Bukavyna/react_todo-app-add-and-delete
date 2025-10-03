import React from 'react';
import { Todo } from '../../types/Todo';

// const [isRemoving, setIsRemoving] = useState(false);
//
// const handleRemoveClick = () => {
//   setIsRemoving(true);
// }

interface TodoItemProps {
  todo: Todo;
  processingIds: number[];
  handleToggleTodo: (todo: Todo) => void;
  handleRemoveTodo: (id: number) => void;
  isBulkProcessing?: boolean;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  processingIds,
  handleToggleTodo,
  handleRemoveTodo,
  isBulkProcessing = false,
}) => {
  const isProcessing = processingIds.includes(todo.id);

  return (
    <div
      data-cy="Todo"
      className={todo.completed ? 'todo completed' : 'todo'}
      key={todo.id}
      style={{ position: 'relative' }}
    >
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          onChange={() => handleToggleTodo(todo)}
          disabled={isProcessing}
        />
      </label>

      <span data-cy="TodoTitle" className="todo__title">
        {todo.title}
      </span>

      <button
        type="button"
        className="todo__remove"
        data-cy="TodoDelete"
        onClick={() => handleRemoveTodo(todo.id)}
        disabled={isProcessing}
      >
        x
      </button>

      {isProcessing && !isBulkProcessing && (
        <div
          data-cy="TodoLoader"
          className={`todo__overlay ${isBulkProcessing ? 'todo__overlay-hidden' : ''}`}
        >
          <div className="todo__loader" />
        </div>
      )}

      {/*<div*/}
      {/*  data-cy="TodoLoader"*/}
      {/*  className={`todo__overlay ${isBulkProcessing ? 'todo__overlay-hidden' : ''}`}*/}
      {/*>*/}
      {/*  <div className="todo__loader" />*/}
      {/*</div>*/}
    </div>
  );
};
