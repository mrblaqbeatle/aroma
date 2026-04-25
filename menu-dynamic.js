// ══════════════════════════════════════════════════════
//  menu-dynamic.js — Menu page dynamic renderer
//  Depends on: supabase-client.js
// ══════════════════════════════════════════════════════

(function () {
    'use strict';

    // In-memory cache
    let _cache = null;

    // ── Build a single .dishes card (matches existing menu.html markup)
    function renderDishCard(dish) {
        const div = document.createElement('div');
        div.className = 'dishes';

        const img = document.createElement('img');
        img.src = dish.image_url || 'asets/imgs/placeholder.png';
        img.alt = dish.name;
        img.loading = 'lazy';

        const h4 = document.createElement('h4');
        h4.textContent = dish.name;

        const p = document.createElement('p');
        p.textContent = dish.description || '';

        const span = document.createElement('span');
        span.textContent = dish.price;

        div.appendChild(img);
        div.appendChild(h4);
        div.appendChild(p);
        div.appendChild(span);

        return div;
    }

    // ── Build a full category section (h2 + .menu section)
    function renderCategorySection(category, dishes) {
        const h2 = document.createElement('h2');
        h2.textContent = category.name;

        const section = document.createElement('section');
        section.className = 'menu';
        section.dataset.categoryId = category.id;

        if (!dishes.length) {
            const empty = document.createElement('p');
            empty.style.cssText = 'text-align:center;padding:1rem;color:#888;width:100%;';
            empty.textContent = 'No dishes in this category yet.';
            section.appendChild(empty);
        } else {
            const fragment = document.createDocumentFragment();
            dishes.forEach(d => fragment.appendChild(renderDishCard(d)));
            section.appendChild(fragment);
        }

        return [h2, section];
    }

    // ── Skeleton loader for menu sections
    function showSkeleton(container) {
        container.innerHTML = '';
        const style = `
            min-height:200px;
            background:linear-gradient(90deg,#d4f5a0 25%,#e2fac9 50%,#d4f5a0 75%);
            background-size:200% 100%;
            animation:shimmer 1.2s infinite;
            border-radius:10px;
            margin-bottom:2rem;
        `;
        for (let i = 0; i < 4; i++) {
            const sk = document.createElement('div');
            sk.style.cssText = style;
            container.appendChild(sk);
        }
    }

    function injectShimmer() {
        if (document.getElementById('aroma-shimmer')) return;
        const s = document.createElement('style');
        s.id = 'aroma-shimmer';
        s.textContent = '@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
        document.head.appendChild(s);
    }

    // ── Fetch all categories + all dishes in two parallel queries
    async function fetchMenuData() {
        if (_cache) return _cache;

        const [catResult, dishResult] = await Promise.all([
            supabaseClient
                .from('categories')
                .select('id, name')
                .order('created_at', { ascending: true }),
            supabaseClient
                .from('dishes')
                .select('id, name, description, price, image_url, category_id')
                .order('created_at', { ascending: true })
        ]);

        if (catResult.error) {
            console.error('[Aroma] Category fetch error:', catResult.error.message);
            return null;
        }
        if (dishResult.error) {
            console.error('[Aroma] Dish fetch error:', dishResult.error.message);
            return null;
        }

        // Group dishes by category_id for O(1) lookup
        const dishesByCategory = {};
        dishResult.data.forEach(dish => {
            if (!dishesByCategory[dish.category_id]) {
                dishesByCategory[dish.category_id] = [];
            }
            dishesByCategory[dish.category_id].push(dish);
        });

        _cache = { categories: catResult.data, dishesByCategory };
        return _cache;
    }

    // ── Main entry point
    async function init() {
        const main = document.querySelector('main');
        if (!main) return;

        // Find the dynamic menu area (after the intro + hr)
        const menuContainer = document.getElementById('menu-dynamic-area');
        if (!menuContainer) return;

        injectShimmer();
        showSkeleton(menuContainer);

        const data = await fetchMenuData();
        menuContainer.innerHTML = '';

        if (!data) {
            menuContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:#c00;">Failed to load menu. Please refresh.</p>';
            return;
        }

        const { categories, dishesByCategory } = data;
        const fragment = document.createDocumentFragment();

        categories.forEach(cat => {
            const dishes = dishesByCategory[cat.id] || [];
            const [h2, section] = renderCategorySection(cat, dishes);
            fragment.appendChild(h2);
            fragment.appendChild(section);
        });

        menuContainer.appendChild(fragment);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
