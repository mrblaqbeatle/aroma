(function () {
    'use strict';


    let categories = [];
    let dishes = [];


    async function authGuard() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return null;
        }
        document.getElementById('admin-email').textContent = session.user.email;
        return session;
    }

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });


    let toastTimer;
    function toast(msg, type = 'success') {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.className = 'toast show ' + type;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
    }


    document.querySelectorAll('.sidebar-nav a[data-panel]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const panelId = link.dataset.panel;

            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');

            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById('panel-' + panelId).classList.add('active');
        });
    });


    async function fetchCategories() {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('id, name')
            .order('created_at', { ascending: true });

        if (error) { toast('Failed to load categories', 'error'); return; }
        categories = data;
        renderCategoriesTable();
        populateCategoryDropdown();
    }

    function renderCategoriesTable() {
        const wrap = document.getElementById('categories-table-wrap');

        if (!categories.length) {
            wrap.innerHTML = '<p class="state-msg">No categories yet. Add one to get started.</p>';
            return;
        }

        const rows = categories.map(cat => `
            <tr>
                <td>${escHtml(cat.name)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary" onclick="editCategory('${cat.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteCategory('${cat.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

        wrap.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    function populateCategoryDropdown() {
        const sel = document.getElementById('dish-category');
      
        sel.innerHTML = '<option value="">— Uncategorized —</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            sel.appendChild(opt);
        });
    }

   
    function openCatModal(cat = null) {
        document.getElementById('cat-modal-title').textContent = cat ? 'Edit Category' : 'Add Category';
        document.getElementById('cat-id').value = cat ? cat.id : '';
        document.getElementById('cat-name').value = cat ? cat.name : '';
        document.getElementById('cat-modal').classList.add('open');
        document.getElementById('cat-name').focus();
    }

    function closeCatModal() {
        document.getElementById('cat-modal').classList.remove('open');
    }

    document.getElementById('add-cat-btn').addEventListener('click', () => openCatModal());
    document.getElementById('cat-cancel-btn').addEventListener('click', closeCatModal);

    document.getElementById('cat-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('cat-modal')) closeCatModal();
    });

    document.getElementById('cat-save-btn').addEventListener('click', async () => {
        const name = document.getElementById('cat-name').value.trim();
        if (!name) { toast('Category name is required', 'error'); return; }

        const id = document.getElementById('cat-id').value;
        const btn = document.getElementById('cat-save-btn');
        btn.disabled = true;

        if (id) {
            // UPDATE
            const { error } = await supabaseClient
                .from('categories')
                .update({ name })
                .eq('id', id);
            if (error) { toast('Update failed: ' + error.message, 'error'); btn.disabled = false; return; }
            toast('Category updated');
        } else {
            // INSERT
            const { error } = await supabaseClient
                .from('categories')
                .insert({ name });
            if (error) { toast('Add failed: ' + error.message, 'error'); btn.disabled = false; return; }
            toast('Category added');
        }

        btn.disabled = false;
        closeCatModal();
        await fetchCategories();
    });

    
    window.editCategory = function (id) {
        const cat = categories.find(c => c.id === id);
        if (cat) openCatModal(cat);
    };

    window.deleteCategory = async function (id) {
        const cat = categories.find(c => c.id === id);
        if (!confirm(`Delete category "${cat?.name}"?\n\nDishes in this category will become uncategorized.`)) return;

        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
        toast('Category deleted');
        await fetchCategories();
        await fetchDishes(); // refresh dishes table too
    };


    async function fetchDishes() {
        const { data, error } = await supabaseClient
            .from('dishes')
            .select('id, name, description, price, image_url, category_id, is_featured, created_at')
            .order('created_at', { ascending: true });

        if (error) { toast('Failed to load dishes', 'error'); return; }
        dishes = data;
        renderDishesTable();
    }

    function getCategoryName(id) {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : '—';
    }

    function renderDishesTable() {
        const wrap = document.getElementById('dishes-table-wrap');
        document.getElementById('dishes-loading').style.display = 'none';

        if (!dishes.length) {
            wrap.innerHTML = '<p class="state-msg">No dishes yet. Add your first dish!</p>';
            return;
        }

        const rows = dishes.map(d => `
            <tr>
                <td>
                    ${d.image_url
                        ? `<img class="dish-thumb" src="${escHtml(d.image_url)}" alt="${escHtml(d.name)}" loading="lazy">`
                        : `<div class="dish-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🍽</div>`
                    }
                </td>
                <td><strong>${escHtml(d.name)}</strong></td>
                <td>${escHtml(d.description || '—')}</td>
                <td>${escHtml(d.price)}</td>
                <td>${escHtml(getCategoryName(d.category_id))}</td>
                <td>
                    <span class="badge ${d.is_featured ? 'badge-yes' : 'badge-no'}">
                        ${d.is_featured ? 'Yes' : 'No'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary" onclick="editDish('${d.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteDish('${d.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

        wrap.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Featured</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }


    const BUCKET = 'restaurant-images';

    
    function setUploadStatus(msg, type = '') {
        const el = document.getElementById('upload-status');
        el.textContent = msg;
        el.className = 'upload-status' + (type ? ' ' + type : '');
    }

    function setUploadAreaState(state) {
        const area = document.getElementById('image-upload-area');
        area.classList.remove('has-image', 'uploading');
        if (state) area.classList.add(state);
    }

    function showPreview(url, filename) {
        const thumb = document.getElementById('dish-image-preview');
        const name  = document.getElementById('dish-image-name');
        if (url) {
            thumb.src = url;
            thumb.classList.add('visible');
        } else {
            thumb.src = '';
            thumb.classList.remove('visible');
        }
        name.textContent = filename || 'No image selected';
    }

    function resetImageWidget() {
        document.getElementById('dish-image-file').value = '';
        document.getElementById('dish-image').value = '';
        showPreview('', '');
        setUploadAreaState('');
        setUploadStatus('');
    }

    
    async function uploadDishImage(file) {
        
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowed.includes(file.type)) {
            throw new Error('Only PNG, JPEG, and WebP images are allowed.');
        }

        
        const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath   = `dishes/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabaseClient.storage
            .from(BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',   
                upsert: false,
            });

        if (uploadError) throw new Error(uploadError.message);

        
        const { data } = supabaseClient.storage
            .from(BUCKET)
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    
    document.getElementById('dish-image-file').addEventListener('change', async function () {
        const file = this.files[0];
        if (!file) return;

       
        const localUrl = URL.createObjectURL(file);
        showPreview(localUrl, file.name);
        setUploadAreaState('uploading');
        setUploadStatus('Uploading…', 'uploading');

        
        document.getElementById('dish-save-btn').disabled = true;

        try {
            const publicUrl = await uploadDishImage(file);
            
            document.getElementById('dish-image').value = publicUrl;
           
            showPreview(publicUrl, file.name);
            setUploadAreaState('has-image');
            setUploadStatus('✓ Uploaded', 'done');
        } catch (err) {
        
            const existingUrl = document.getElementById('dish-image').value;
            showPreview(existingUrl || '', existingUrl ? 'Current image' : '');
            setUploadAreaState(existingUrl ? 'has-image' : '');
            setUploadStatus('Upload failed: ' + err.message, 'error');
            toast('Image upload failed: ' + err.message, 'error');
        } finally {
            document.getElementById('dish-save-btn').disabled = false;
        }
    });

   
    function openDishModal(dish = null) {
        document.getElementById('dish-modal-title').textContent = dish ? 'Edit Dish' : 'Add Dish';
        document.getElementById('dish-id').value           = dish ? dish.id : '';
        document.getElementById('dish-name').value         = dish ? dish.name : '';
        document.getElementById('dish-description').value  = dish ? (dish.description || '') : '';
        document.getElementById('dish-price').value        = dish ? dish.price : '';
        document.getElementById('dish-category').value     = dish ? (dish.category_id || '') : '';
        document.getElementById('dish-featured').checked   = dish ? dish.is_featured : false;

       
        const url = dish ? (dish.image_url || '') : '';
        document.getElementById('dish-image').value = url;
        if (url) {
            
            const filename = url.split('/').pop().split('?')[0] || 'Current image';
            showPreview(url, filename);
            setUploadAreaState('has-image');
            setUploadStatus('');
        } else {
            resetImageWidget();
        }

        document.getElementById('dish-modal').classList.add('open');
        document.getElementById('dish-name').focus();
    }

    function closeDishModal() {
        document.getElementById('dish-modal').classList.remove('open');
        
        document.getElementById('dish-image-file').value = '';
    }

    document.getElementById('add-dish-btn').addEventListener('click', () => openDishModal());
    document.getElementById('dish-cancel-btn').addEventListener('click', closeDishModal);

    document.getElementById('dish-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('dish-modal')) closeDishModal();
    });

    document.getElementById('dish-save-btn').addEventListener('click', async () => {
        const name  = document.getElementById('dish-name').value.trim();
        const price = document.getElementById('dish-price').value.trim();

        if (!name)  { toast('Dish name is required', 'error');  return; }
        if (!price) { toast('Dish price is required', 'error'); return; }

        const payload = {
            name,
            description: document.getElementById('dish-description').value.trim() || null,
            price,
            image_url:   document.getElementById('dish-image').value.trim() || null,
            category_id: document.getElementById('dish-category').value || null,
            is_featured: document.getElementById('dish-featured').checked,
        };

        const id  = document.getElementById('dish-id').value;
        const btn = document.getElementById('dish-save-btn');
        btn.disabled = true;

        if (id) {
            const { error } = await supabaseClient.from('dishes').update(payload).eq('id', id);
            if (error) { toast('Update failed: ' + error.message, 'error'); btn.disabled = false; return; }
            toast('Dish updated');
        } else {
            const { error } = await supabaseClient.from('dishes').insert(payload);
            if (error) { toast('Add failed: ' + error.message, 'error'); btn.disabled = false; return; }
            toast('Dish added');
        }

        btn.disabled = false;
        closeDishModal();
        await fetchDishes();
    });

    window.editDish = function (id) {
        const dish = dishes.find(d => d.id === id);
        if (dish) openDishModal(dish);
    };

    window.deleteDish = async function (id) {
        const dish = dishes.find(d => d.id === id);
        if (!confirm(`Delete "${dish?.name}"? This cannot be undone.`)) return;

        const { error } = await supabaseClient.from('dishes').delete().eq('id', id);
        if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
        toast('Dish deleted');
        await fetchDishes();
    };

  
    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

   
    async function init() {
        const session = await authGuard();
        if (!session) return;

        
        await fetchCategories();
        await fetchDishes();
    }

    init();
})();
