/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useRef } from 'react';
import { UserWarning } from './UserWarning';
import { getTodos, USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import { todosService } from './services/todosService';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const newTodoFiled = useRef<HTMLInputElement | null>(null);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [processingIds, setProcessingIds] = useState<number[]>([]); // НОВИЙ СТАН
  const [isCreatingTodo, setIsCreatingTodo] = useState(false);

  // Фокусуємо інпут при першому рендері
  useEffect(() => {
    if (newTodoFiled.current) {
      newTodoFiled.current!.focus();
    }
  }, []);

  // Завантаження todos
  useEffect(() => {
    let timer: number | null = null;

    const loadTodos = async () => {
      setIsLoading(true); // Показуємо спіннер
      setError(null); // Очищаємо попередні помилки

      try {
        const data = await getTodos();

        setTodos(data);
      } catch (err) {
        setError(err?.message || 'Unable to load todos');

        timer = window.setTimeout(() => setError(null), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTodos();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const filters = {
    all: (t: Todo[]) => t,
    active: (t: Todo[]) => t.filter(todo => !todo.completed),
    completed: (t: Todo[]) => t.filter(todo => todo.completed),
  };

  const getFilteredTodos = () => {
    return (filters[status] || filters.all)(todos);
  };

  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  const completedTodosCount = todos.filter(todo => todo.completed).length;

  // Додавання нового todo
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();

    if (!title) {
      setError('Title should not be empty');
      setTimeout(() => setError(null), 3000);

      return;
    }

    // Створюємо тимчасовий todo для спіннера
    const temp: Todo = {
      id: 0,
      title,
      completed: false,
      userId: USER_ID,
    };

    setTempTodo(temp);
    setNewTitle('');
    setIsCreatingTodo(true);

    try {
      const created = await todosService.addTodo(title);

      setTodos(prev => [...prev, created]);
      setTempTodo(null); // ховаємо тимчасовий todo

    } catch {
      setError('Unable to add a todo');
      setTempTodo(null); // ховаємо тимчасовий todo

      if (newTodoFiled.current) {
        newTodoFiled.current!.focus();
      }

      setNewTitle(title); // залишаємо текст
      setTimeout(() => setError(null), 3000);

    } finally {
      setIsCreatingTodo(false);
      if (newTodoFiled.current) {
        newTodoFiled.current!.focus();
      }
    }
  };

  // Видалення todo
  const handleRemoveTodo = async (id: number) => {
    setProcessingIds(prev => [...prev, id]);

    try {
      await todosService.removeTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch {
      setError('Unable to delete a todo');
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingIds(prev => prev.filter(todoId => todoId !== id));
    }
  };

  // Переключення completed
  const handleToggleTodo = async (todo: Todo) => {
    setProcessingIds(prev => [...prev, todo.id]);

    try {
      const updated = await todosService.toggleTodo(todo);

      setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    } catch {
      setError('Unable to update a todo');
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingIds(prev => prev.filter(todoId => todoId !== todo.id));
    }
  };

  // Очистка всіх completed
  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(t => t.completed);

    setProcessingIds(prev => [...prev, ...completedTodos.map(t => t.id)]);

    try {
      await Promise.all(completedTodos.map(t => todosService.removeTodo(t.id)));
      setTodos(prev => prev.filter(t => !t.completed));
    } catch {
      setError('Unable to clear completed todos');
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingIds(prev =>
        prev.filter(id => !completedTodos.map(t => t.id).includes(id)),
      );
    }
  };

  const handleToggleAll = async () => {
    // Визначаємо, чи всі todo завершені
    const areAllCompleted = todos.every(todo => todo.completed);
    // Визначаємо новий стан для всіх todo
    const newCompletedStatus = !areAllCompleted;
    // Знаходимо todos, які потребують зміни стану
    const todosToToggle = todos.filter(
      todo => todo.completed !== newCompletedStatus,
    );

    // Якщо нічого змінювати, виходимо
    if (todosToToggle.length === 0) {
      return;
    }

    // Додаємо ID всіх todo, які будуть оновлюватися, до processingIds
    const idsToProcess = todosToToggle.map(t => t.id);

    setProcessingIds(prev => [...prev, ...idsToProcess]);

    try {
      const updatedTodos = await todosService.toggleAllTodos(
        todosToToggle,
        newCompletedStatus,
      );

      // Оновлюємо основний список todos
      setTodos(prev =>
        prev.map(t => {
          const updated = updatedTodos.find(u => u.id === t.id);

          return updated || t;
        }),
      );
    } catch {
      setError('Unable to toggle all todos');
      setTimeout(() => setError(null), 3000);
    } finally {
      // Видаляємо всі оброблені ID зі списку
      setProcessingIds(prev => prev.filter(id => !idsToProcess.includes(id)));
    }
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {todos.length > 0 && (
            <button
              type="button"
              className={`todoapp__toggle-all ${todos.every(todo => todo.completed) ? 'active' : ''}`}
              data-cy="ToggleAllButton"
              onClick={handleToggleAll}
              disabled={processingIds.length > 0}
            />
          )}

          {/* Add a todo on form submit */}
          <form onSubmit={handleAddTodo}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              ref={newTodoFiled}
              disabled={isCreatingTodo}
            />
          </form>
        </header>

        {isLoading && todos.length === 0 ? (
          <p>Loading...</p>
        ) : (
          (todos.length > 0 || tempTodo) && (
            <section className="todoapp__main" data-cy="TodoList">
              {/* This is a completed todo */}
              {getFilteredTodos().map(todo => (
                <div
                  data-cy="Todo"
                  className={todo.completed ? 'todo completed' : 'todo'}
                  key={todo.id}
                >
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo)}
                      disabled={processingIds.includes(todo.id)}
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
                    disabled={processingIds.includes(todo.id)}
                  >
                    x
                  </button>

                  {processingIds.includes(todo.id) && (
                    <div data-cy="TodoLoader" className="modal overlay">
                      {/*eslint-disable-next-line max-len*/}
                      <div className="modal-background has-background-white-ter" />
                      <div className="loader" />
                    </div>
                  )}
                </div>
              ))}

              {/* 9. Відображення тимчасового todo, якщо він є */}
              {tempTodo && status !== 'completed' && (
                <div
                  data-cy="Todo"
                  className="todo" // нові todo не мають бути completed
                  key="temp-todo-loader" // ID 0 - це унікальний ID для тимчасового
                >
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status"
                      checked={false} // завжди false для тимчасового
                      disabled // 10. Блокування чекбоксу для тимчасового todo
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
                  >
                    x
                  </button>

                  {/* Спіннер для тимчасового todo */}
                  {tempTodo && isCreatingTodo && (
                    <div data-cy="TodoLoader" className="modal overlay">
                      <div
                        className="modal-background
                        has-background-white-ter"
                      />
                      <div className="loader" />
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        )}

        {todos.length > 0 && (
          // Hide the footer if there are no todos
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {activeTodosCount} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${status === 'all' ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={() => setStatus('all')}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${status === 'active' ? 'selected' : ''}`}
                data-cy="FilterLinkActive"
                onClick={() => setStatus('active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${status === 'completed' ? 'selected' : ''}`}
                data-cy="FilterLinkCompleted"
                onClick={() => setStatus('completed')}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={completedTodosCount === 0}
              onClick={handleClearCompleted}
            >
              Clear completed
            </button>
          </footer>
        )}

        {/*DON'T use conditional rendering to hide the notification*/}
        {/* Add the 'hidden' class to hide the message smoothly */}
        <div
          data-cy="ErrorNotification"
          className={`notification is-danger is-light has-text-weight-normal ${error ? '' : 'hidden'}`}
        >
          {error}
          <button
            data-cy="HideErrorButton"
            type="button"
            className="delete"
            onClick={() => setError(null)}
          />
        </div>
      </div>
    </div>
  );
};
