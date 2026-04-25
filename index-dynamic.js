// ══════════════════════════════════════════════════════
//  index-dynamic.js — Homepage featured dishes loader
//  Depends on: supabase-client.js
// ══════════════════════════════════════════════════════

(function () {
    'use strict';

    // In-memory cache so navigating back doesn't re-fetch
    let _cache = null;

    // ── Render a single featured dish card (matches existing .todaysdishes markup)
    function renderCard(dish) {
        const div = document.createElement('div');
        div.className = 'todaysdishes';

        const img = document.createElement('img');
        img.src = dish.image_url || 'asets/imgs/placeholder.png';
        img.alt = dish.name;
        img.loading = 'lazy'; // lazy load per performance requirement

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

    // ── Show skeleton cards while loading (prevents layout shift)
    function showSkeletons(container, count) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const sk = document.createElement('div');
            sk.className = 'todaysdishes dish-skeleton';
            sk.style.cssText = 'min-height:320px;background:linear-gradient(90deg,#d4f5a0 25%,#e2fac9 50%,#d4f5a0 75%);background-size:200% 100%;animation:shimmer 1.2s infinite;';
            container.appendChild(sk);
        }
    }

    // ── Inject shimmer keyframes once
    function injectShimmer() {
        if (document.getElementById('aroma-shimmer')) return;
        const style = document.createElement('style');
        style.id = 'aroma-shimmer';
        style.textContent = '@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
        document.head.appendChild(style);
    }

    // ── Fetch featured dishes from Supabase
    async function fetchFeatured() {
        if (_cache) return _cache;

        const { data, error } = await supabaseClient
            .from('dishes')
            .select('id, name, description, price, image_url')
            .eq('is_featured', true)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[Aroma] Failed to load featured dishes:', error.message);
            return [];
        }

        _cache = data;
        return data;
    }

    // ── Main entry point
    async function init() {
        const container = document.querySelector('.ontoday');
        if (!container) return;

        injectShimmer();
        showSkeletons(container, 3);

        const dishes = await fetchFeatured();
        container.innerHTML = '';

        if (!dishes.length) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">No featured dishes at the moment. Check back soon!</p>';
            return;
        }

        // Render cards using document fragment for single DOM write
        const fragment = document.createDocumentFragment();
        dishes.forEach(dish => fragment.appendChild(renderCard(dish)));
        container.appendChild(fragment);
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
