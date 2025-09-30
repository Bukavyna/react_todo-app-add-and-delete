import React from 'react';
import { Todo } from '../../types/Todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  processingIds: number[];
  getFilteredTodos: () => Todo[];
  handleToggleTodo: (todo: Todo) => void;
  handleRemoveTodo: (id: number) => void;
  tempTodo?: Todo | null;
  isCreatingTodo?: boolean;
  isLoading: boolean;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  processingIds,
  getFilteredTodos,
  handleToggleTodo,
  handleRemoveTodo,
  tempTodo,
  isCreatingTodo,
  isLoading,
}) => {
  return (
    <div className="todoapp__content">
      {isLoading && todos.length === 0 ? (
        <p>Loading...</p>
      ) : (
        (todos.length > 0 || tempTodo) && (
          <section className="todoapp__main" data-cy="TodoList">
            {getFilteredTodos().map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                processingIds={processingIds}
                handleToggleTodo={handleToggleTodo}
                handleRemoveTodo={handleRemoveTodo}
              />
            ))}

            {tempTodo && (
              <div className="todo" key="temp-todo-loader">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    checked={false}
                    disabled
                  />
                </label>
                <span data-cy="TodoTitle" className="todo__title">
                  {tempTodo.title}
                </span>
                <button
                  type="button"
                  className="todo__remove"
                  data-cy="TodoDelete"
                  disabled
                />
                {isCreatingTodo && (
                  <div data-cy="TodoLoader" className="modal overlay is-active">
                    {/*eslint-disable-next-line max-len*/}
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                )}
              </div>
            )}
          </section>
        )
      )}
    </div>
  );
};
