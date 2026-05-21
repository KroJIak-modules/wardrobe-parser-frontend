import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE, authFetch } from "../shared/admin-auth";

type ScopeItem = {
  key: string;
  read: string;
  edit: string;
};

type RoleItem = {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
};

type UserItem = {
  id: number;
  login: string;
  is_active: boolean;
  is_superuser: boolean;
  role_id: number | null;
  role_name: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
};

type BootstrapPayload = {
  scopes: ScopeItem[];
  roles: RoleItem[];
  users: UserItem[];
};

type MePayload = {
  user_id: number;
  login: string;
  role_name: string | null;
  is_superuser: boolean;
  is_active: boolean;
  permissions: string[];
};

type Props = {
  pushToast: (message: string, type?: "success" | "error") => void;
};

const SCOPE_LABELS: Record<string, string> = {
  showcase: "Витрина и карточка товара",
  "control.sources": "Источники и синхронизация",
  "control.products": "Товары",
  "control.dedup": "Дедубликация",
  "control.categories": "Категории",
  "control.designers": "Дизайнеры",
  "control.pricing": "Ценообразование",
  "control.weight": "Вес",
  "control.settings": "Настройки",
  accounts: "Аккаунты и роли",
};

const EMPTY_BOOTSTRAP: BootstrapPayload = {
  scopes: [],
  roles: [],
  users: [],
};

async function readJsonOrError<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Ошибка: ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload?.detail) detail = String(payload.detail);
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export function AdminSettingsAccountsSection({ pushToast }: Props) {
  const [me, setMe] = useState<MePayload | null>(null);
  const [loadingMe, setLoadingMe] = useState<boolean>(true);
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const [editRoleName, setEditRoleName] = useState<string>("");
  const [editRolePermissions, setEditRolePermissions] = useState<Set<string>>(new Set<string>());
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState<boolean>(false);
  const [createRoleName, setCreateRoleName] = useState<string>("");
  const [createRolePermissions, setCreateRolePermissions] = useState<Set<string>>(new Set<string>());

  const [newUserLogin, setNewUserLogin] = useState<string>("");
  const [newUserPassword, setNewUserPassword] = useState<string>("");
  const [newUserRoleId, setNewUserRoleId] = useState<number | null>(null);

  const [passwordDraftByUserId, setPasswordDraftByUserId] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<boolean>(false);

  const loadMe = useCallback(async () => {
    setLoadingMe(true);
    try {
      const response = await authFetch(`${API_BASE}/auth/me`);
      const payload = await readJsonOrError<MePayload>(response);
      setMe(payload);
    } catch {
      setMe(null);
    } finally {
      setLoadingMe(false);
    }
  }, []);

  const loadBootstrap = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE}/auth/accounts/bootstrap`);
      const payload = await readJsonOrError<BootstrapPayload>(response);
      setBootstrap(payload);
      setSelectedRoleId((prev) => {
        if (prev != null && payload.roles.some((role) => role.id === prev)) {
          return prev;
        }
        return payload.roles[0]?.id ?? null;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить аккаунты";
      pushToast(message, "error");
    }
  }, [pushToast]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (!me?.is_superuser) return;
    void loadBootstrap();
  }, [me?.is_superuser, loadBootstrap]);

  const selectedRole = useMemo(() => {
    return bootstrap.roles.find((role) => role.id === selectedRoleId) ?? null;
  }, [bootstrap.roles, selectedRoleId]);

  useEffect(() => {
    if (!selectedRole) return;
    setEditRoleName(selectedRole.name);
    setEditRolePermissions(new Set(selectedRole.permissions || []));
  }, [selectedRole?.id]);

  const resetCreateRoleDraft = useCallback(() => {
    setCreateRoleName("");
    setCreateRolePermissions(new Set<string>());
  }, []);

  const toggleEditPermission = useCallback((permissionKey: string) => {
    setEditRolePermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionKey)) {
        next.delete(permissionKey);
      } else {
        next.add(permissionKey);
      }
      return next;
    });
  }, []);

  const toggleCreatePermission = useCallback((permissionKey: string) => {
    setCreateRolePermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionKey)) {
        next.delete(permissionKey);
      } else {
        next.add(permissionKey);
      }
      return next;
    });
  }, []);

  const onCreateRole = useCallback(async () => {
    const name = createRoleName.trim();
    if (!name) {
      pushToast("Введите название роли", "error");
      return;
    }
    setBusy(true);
    try {
      const response = await authFetch(`${API_BASE}/auth/accounts/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: null,
          permissions: Array.from(createRolePermissions),
        }),
      });
      await readJsonOrError<RoleItem>(response);
      pushToast("Роль создана");
      resetCreateRoleDraft();
      setIsCreateRoleOpen(false);
      await loadBootstrap();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось создать роль", "error");
    } finally {
      setBusy(false);
    }
  }, [createRoleName, createRolePermissions, pushToast, resetCreateRoleDraft, loadBootstrap]);

  const onUpdateRole = useCallback(async () => {
    if (!selectedRole) return;
    const name = editRoleName.trim();
    if (!name) {
      pushToast("Введите название роли", "error");
      return;
    }
    setBusy(true);
    try {
      const response = await authFetch(`${API_BASE}/auth/accounts/roles/${selectedRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: null,
          permissions: Array.from(editRolePermissions),
        }),
      });
      await readJsonOrError<RoleItem>(response);
      pushToast("Роль обновлена");
      await loadBootstrap();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось обновить роль", "error");
    } finally {
      setBusy(false);
    }
  }, [selectedRole, editRoleName, editRolePermissions, pushToast, loadBootstrap]);

  const onDeleteRole = useCallback(async (roleId: number) => {
    setBusy(true);
    try {
      const response = await authFetch(`${API_BASE}/auth/accounts/roles/${roleId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        await readJsonOrError<void>(response);
      }
      pushToast("Роль удалена");
      if (selectedRoleId === roleId) {
        setSelectedRoleId(null);
        setEditRoleName("");
        setEditRolePermissions(new Set<string>());
      }
      await loadBootstrap();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось удалить роль", "error");
    } finally {
      setBusy(false);
    }
  }, [pushToast, loadBootstrap, selectedRoleId]);

  const onCreateUser = useCallback(async () => {
    const login = newUserLogin.trim();
    if (!login) {
      pushToast("Введите логин пользователя", "error");
      return;
    }
    if (newUserPassword.trim().length < 8) {
      pushToast("Пароль должен быть минимум 8 символов", "error");
      return;
    }
    if (newUserRoleId == null) {
      pushToast("Выберите роль для пользователя", "error");
      return;
    }
    setBusy(true);
    try {
      const response = await authFetch(`${API_BASE}/auth/accounts/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          password: newUserPassword,
          role_id: newUserRoleId,
          is_active: true,
        }),
      });
      await readJsonOrError<UserItem>(response);
      pushToast("Пользователь создан");
      setNewUserLogin("");
      setNewUserPassword("");
      setNewUserRoleId(null);
      await loadBootstrap();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось создать пользователя", "error");
    } finally {
      setBusy(false);
    }
  }, [newUserLogin, newUserPassword, newUserRoleId, pushToast, loadBootstrap]);

  const onUpdateUser = useCallback(
    async (user: UserItem, updates: { login?: string; role_id?: number | null; is_active?: boolean }) => {
      if (user.is_superuser) {
        pushToast("Параметры суперадмина менять нельзя в этом блоке", "error");
        return;
      }
      setBusy(true);
      try {
        const response = await authFetch(`${API_BASE}/auth/accounts/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            login: (updates.login ?? user.login).trim(),
            role_id: updates.role_id ?? user.role_id,
            is_active: updates.is_active ?? user.is_active,
          }),
        });
        await readJsonOrError<UserItem>(response);
        pushToast("Пользователь обновлен");
        await loadBootstrap();
      } catch (error) {
        pushToast(error instanceof Error ? error.message : "Не удалось обновить пользователя", "error");
      } finally {
        setBusy(false);
      }
    },
    [pushToast, loadBootstrap]
  );

  const onResetUserPassword = useCallback(
    async (userId: number) => {
      const password = (passwordDraftByUserId[userId] || "").trim();
      if (password.length < 8) {
        pushToast("Новый пароль должен быть минимум 8 символов", "error");
        return;
      }
      setBusy(true);
      try {
        const response = await authFetch(`${API_BASE}/auth/accounts/users/${userId}/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!response.ok && response.status !== 204) {
          await readJsonOrError<void>(response);
        }
        pushToast("Пароль обновлен");
        setPasswordDraftByUserId((prev) => ({ ...prev, [userId]: "" }));
      } catch (error) {
        pushToast(error instanceof Error ? error.message : "Не удалось сменить пароль", "error");
      } finally {
        setBusy(false);
      }
    },
    [passwordDraftByUserId, pushToast]
  );

  const onDeleteUser = useCallback(
    async (userId: number) => {
      setBusy(true);
      try {
        const response = await authFetch(`${API_BASE}/auth/accounts/users/${userId}`, { method: "DELETE" });
        if (!response.ok && response.status !== 204) {
          await readJsonOrError<void>(response);
        }
        pushToast("Пользователь удален");
        await loadBootstrap();
      } catch (error) {
        pushToast(error instanceof Error ? error.message : "Не удалось удалить пользователя", "error");
      } finally {
        setBusy(false);
      }
    },
    [pushToast, loadBootstrap]
  );

  if (loadingMe) {
    return <p className="muted">Проверка прав суперадмина...</p>;
  }
  if (!me?.is_superuser) {
    return <p className="muted">Управление ролями и пользователями доступно только суперадмину.</p>;
  }

  return (
    <div className="admin-accounts-layout">
      <section className="admin-accounts-block">
        <div className="admin-accounts-block__head">
          <h3>Роли</h3>
          <button
            type="button"
            onClick={() => {
              resetCreateRoleDraft();
              setIsCreateRoleOpen(true);
            }}
            disabled={busy}
          >
            Новая роль
          </button>
        </div>

        <div className="admin-accounts-list">
          {bootstrap.roles.map((role) => (
            <button
              key={role.id}
              type="button"
              className={selectedRoleId === role.id ? "admin-accounts-role admin-accounts-role--active" : "admin-accounts-role"}
              onClick={() => setSelectedRoleId(role.id)}
              disabled={busy}
            >
              <span>{role.name}</span>
              <small>{(role.permissions || []).length} прав</small>
            </button>
          ))}
          {bootstrap.roles.length === 0 ? <p className="muted">Пока нет ролей.</p> : null}
        </div>

        <div className="admin-accounts-form-grid">
          <label>
            <span>Название роли</span>
            <input
              value={editRoleName}
              onChange={(event) => setEditRoleName(event.target.value)}
              disabled={busy || !selectedRole}
              placeholder={selectedRole ? "" : "Выберите роль слева"}
            />
          </label>
        </div>

        <div className="admin-accounts-permissions-grid">
          {bootstrap.scopes.map((scope) => (
            <div key={scope.key} className="admin-accounts-scope">
              <p className="admin-accounts-scope__title">{SCOPE_LABELS[scope.key] || scope.key}</p>
              <div className="admin-accounts-scope__actions">
                <label className="admin-accounts-perm-check">
                  <input
                    type="checkbox"
                    checked={editRolePermissions.has(scope.read)}
                    onChange={() => toggleEditPermission(scope.read)}
                    disabled={busy || !selectedRole}
                  />
                  <span>Просмотр</span>
                </label>
                <label className="admin-accounts-perm-check">
                  <input
                    type="checkbox"
                    checked={editRolePermissions.has(scope.edit)}
                    onChange={() => toggleEditPermission(scope.edit)}
                    disabled={busy || !selectedRole}
                  />
                  <span>Изменение</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-accounts-actions">
          <button type="button" onClick={() => void onUpdateRole()} disabled={busy || !selectedRole}>
            Сохранить роль
          </button>
          <button
            type="button"
            className="topbar-cta--danger"
            onClick={() => {
              if (selectedRole) void onDeleteRole(selectedRole.id);
            }}
            disabled={busy || !selectedRole}
          >
            Удалить роль
          </button>
        </div>
      </section>

      {isCreateRoleOpen ? (
        <div className="modal-backdrop" onClick={() => (!busy ? setIsCreateRoleOpen(false) : undefined)}>
          <div className="modal admin-accounts-create-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Создание роли</h3>
            </div>
            <label className="admin-accounts-form-grid">
              <span>Название роли</span>
              <input
                value={createRoleName}
                onChange={(event) => setCreateRoleName(event.target.value)}
                disabled={busy}
                placeholder="Название роли"
              />
            </label>
            <div className="admin-accounts-permissions-grid">
              {bootstrap.scopes.map((scope) => (
                <div key={`create-${scope.key}`} className="admin-accounts-scope">
                  <p className="admin-accounts-scope__title">{SCOPE_LABELS[scope.key] || scope.key}</p>
                  <div className="admin-accounts-scope__actions">
                    <label className="admin-accounts-perm-check">
                      <input
                        type="checkbox"
                        checked={createRolePermissions.has(scope.read)}
                        onChange={() => toggleCreatePermission(scope.read)}
                        disabled={busy}
                      />
                      <span>Просмотр</span>
                    </label>
                    <label className="admin-accounts-perm-check">
                      <input
                        type="checkbox"
                        checked={createRolePermissions.has(scope.edit)}
                        onChange={() => toggleCreatePermission(scope.edit)}
                        disabled={busy}
                      />
                      <span>Изменение</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="admin-accounts-actions">
              <button type="button" onClick={() => setIsCreateRoleOpen(false)} disabled={busy}>
                Отмена
              </button>
              <button type="button" onClick={() => void onCreateRole()} disabled={busy}>
                Создать
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="admin-accounts-block">
        <div className="admin-accounts-block__head">
          <h3>Пользователи</h3>
        </div>

        <div className="admin-accounts-form-grid admin-accounts-form-grid--users">
          <label>
            <span>Логин</span>
            <input value={newUserLogin} onChange={(event) => setNewUserLogin(event.target.value)} disabled={busy} autoComplete="off" />
          </label>
          <label>
            <span>Пароль</span>
            <input
              type="password"
              value={newUserPassword}
              onChange={(event) => setNewUserPassword(event.target.value)}
              disabled={busy}
              autoComplete="new-password"
            />
          </label>
          <label>
            <span>Роль</span>
            <select
              value={newUserRoleId == null ? "" : String(newUserRoleId)}
              onChange={(event) => setNewUserRoleId(event.target.value ? Number(event.target.value) : null)}
              disabled={busy}
            >
              <option value="">Выберите роль</option>
              {bootstrap.roles.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-accounts-actions admin-accounts-actions--inline">
          <button type="button" className="admin-accounts-btn--compact" onClick={() => void onCreateUser()} disabled={busy}>
            Создать пользователя
          </button>
        </div>

        <div className="admin-accounts-users-table-wrap">
          <table className="products-table admin-accounts-users-table">
            <thead>
              <tr>
                <th>Логин</th>
                <th>Роль</th>
                <th>Активен</th>
                <th>Смена пароля</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bootstrap.users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      value={user.login}
                      disabled={busy || user.is_superuser}
                      onChange={(event) => {
                        const next = event.target.value;
                        setBootstrap((prev) => ({
                          ...prev,
                          users: prev.users.map((row) => (row.id === user.id ? { ...row, login: next } : row)),
                        }));
                      }}
                    />
                  </td>
                  <td>
                    <select
                      value={user.role_id == null ? "" : String(user.role_id)}
                      disabled={busy || user.is_superuser}
                      onChange={(event) => {
                        const nextRoleId = event.target.value ? Number(event.target.value) : null;
                        setBootstrap((prev) => ({
                          ...prev,
                          users: prev.users.map((row) =>
                            row.id === user.id
                              ? {
                                  ...row,
                                  role_id: nextRoleId,
                                  role_name: prev.roles.find((role) => role.id === nextRoleId)?.name ?? null,
                                }
                              : row
                          ),
                        }));
                      }}
                    >
                      <option value="">Без роли</option>
                      {bootstrap.roles.map((role) => (
                        <option key={role.id} value={String(role.id)}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label className="ui-switch ui-switch--compact">
                      <input
                        type="checkbox"
                        checked={Boolean(user.is_active)}
                        disabled={busy || user.is_superuser}
                        onChange={(event) => {
                          const checked = Boolean(event.target.checked);
                          setBootstrap((prev) => ({
                            ...prev,
                            users: prev.users.map((row) => (row.id === user.id ? { ...row, is_active: checked } : row)),
                          }));
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                    </label>
                  </td>
                  <td>
                    <div className="admin-accounts-password-row">
                      <input
                        type="password"
                        value={passwordDraftByUserId[user.id] || ""}
                        onChange={(event) => setPasswordDraftByUserId((prev) => ({ ...prev, [user.id]: event.target.value }))}
                        disabled={busy || user.is_superuser}
                        placeholder="Новый пароль"
                      />
                      <button type="button" onClick={() => void onResetUserPassword(user.id)} disabled={busy || user.is_superuser}>
                        Сменить
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-accounts-row-actions">
                      <button
                        type="button"
                        onClick={() =>
                          void onUpdateUser(user, {
                            login: user.login,
                            role_id: user.role_id,
                            is_active: user.is_active,
                          })
                        }
                        disabled={busy || user.is_superuser}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="topbar-cta--danger"
                        onClick={() => void onDeleteUser(user.id)}
                        disabled={busy || user.is_superuser}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bootstrap.users.length === 0 ? <p className="muted">Пользователей пока нет.</p> : null}
        </div>
      </section>
    </div>
  );
}
