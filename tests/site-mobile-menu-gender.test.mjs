import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

globalThis.window = { location: { origin: "http://localhost:10530" } };

const bundle = await build({
  entryPoints: ["src/site/features/header/site-mobile-menu-data.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const menuData = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

const payload = {
  desktop_menus: {
    new: {
      key: "new",
      columns: [
        {
          id: "new-availability",
          align: "start",
          entries: [
            {
              id: "new-availability-in-stock",
              label: "В наличии",
              presentation: "item",
              description: null,
              target: { pathname: "/catalog", query: { availability: "in-stock" } },
            },
            {
              id: "new-availability-all",
              label: "Все товары",
              presentation: "item",
              description: null,
              target: { pathname: "/catalog", query: {} },
            },
          ],
        },
      ],
    },
    designers: {
      key: "designers",
      columns: [
        {
          id: "designers-col-1",
          align: "start",
          entries: [
            {
              id: "designer-new-rock",
              label: "New Rock",
              presentation: "item",
              description: null,
              target: { pathname: "/catalog", query: { designer: "new-rock" } },
            },
          ],
        },
      ],
    },
    men: { key: "men", columns: [] },
    women: { key: "women", columns: [] },
  },
  mobile_menu: {
    groups_by_gender: {
      men: [
        {
          id: "mobile-pair:1",
          label: "Одежда и Обувь",
          entries: [
            {
              id: "item-1",
              label: "Футболки и лонгсливы",
              presentation: "item",
              description: null,
              target: { pathname: "/catalog", query: { section: ["futbolki-i-longslivy"], gender: "men" } },
            },
          ],
        },
      ],
      women: [],
    },
  },
  catalog_contexts: { designers: [], custom_catalogs: [] },
  top_sections: [],
};

test("the new arrivals panel applies the gender chosen in the burger", () => {
  const groups = menuData.getSiteMobileMenuGroups(payload, "new", "women");
  const actions = groups.flatMap((group) => group.actions);

  assert.equal(actions.length, 2);
  for (const action of actions) {
    assert.match(action.to ?? "", /gender=women/);
  }
});

test("the designers panel keeps the catalog without a gender filter", () => {
  const groups = menuData.getSiteMobileMenuGroups(payload, "designers", "women");
  const actions = groups.flatMap((group) => group.actions);

  assert.equal(actions.length, 1);
  assert.equal(actions[0].to, "/catalog?designer=new-rock");
});

test("gender groups keep the gender from the navigation payload", () => {
  const groups = menuData.getSiteMobileMenuGroups(payload, "root-group:mobile-pair:1", "men");
  const actions = groups.flatMap((group) => group.actions);

  assert.equal(actions.length, 1);
  assert.match(actions[0].to ?? "", /gender=men/);
});
