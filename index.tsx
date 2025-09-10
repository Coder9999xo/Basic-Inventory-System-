// Fix: Add an interface for stock items for better type safety.
interface StockItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    dateAdded: string;
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    // Fix: Cast DOM elements to their specific types to access properties like 'value' and 'reset'.
    const addItemForm = document.getElementById('add-item-form') as HTMLFormElement;
    const searchBar = document.getElementById('search-bar') as HTMLInputElement;
    const inventoryTableBody = document.getElementById('inventory-table-body') as HTMLTableSectionElement;
    const emptyMessage = document.getElementById('empty-inventory-message') as HTMLElement;
    const tableContainer = document.getElementById('table-container') as HTMLElement;
    const itemNameInput = document.getElementById('item-name') as HTMLInputElement;
    const itemCategoryInput = document.getElementById('item-category') as HTMLInputElement;
    const itemQuantityInput = document.getElementById('item-quantity') as HTMLInputElement;
    const itemUnitInput = document.getElementById('item-unit') as HTMLSelectElement;
    
    // --- State Management ---
    // Fix: Use the StockItem interface for the stockItems array.
    let stockItems: StockItem[] = [];
    let isEditing = false;

    // --- Data Persistence (localStorage) ---

    const loadItemsFromLocalStorage = () => {
        const itemsJSON = localStorage.getItem('stockItems');
        const items = itemsJSON ? JSON.parse(itemsJSON) : [];
        // Add a migration step for items without a 'unit'
        stockItems = items.map((item: any) => ({
            ...item,
            unit: item.unit || 'pcs' // Default to 'pcs' for old items
        }));
    };

    const saveItemsToLocalStorage = () => {
        localStorage.setItem('stockItems', JSON.stringify(stockItems));
    };

    // --- UI Rendering ---

    const renderTable = (itemsToRender: StockItem[]) => {
    inventoryTableBody.innerHTML = '';
    
    if (itemsToRender.length === 0) {
        emptyMessage.classList.remove('hidden');
        tableContainer.classList.add('hidden');
    } else {
        emptyMessage.classList.add('hidden');
        tableContainer.classList.remove('hidden');
    }

    const sortedItems = [...itemsToRender].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    
    sortedItems.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = item.name;
        row.appendChild(nameCell);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = item.category;
        row.appendChild(categoryCell);

        const quantityCell = document.createElement('td');
        quantityCell.className = 'quantity-cell';
        quantityCell.textContent = String(item.quantity);
        row.appendChild(quantityCell);

        const unitCell = document.createElement('td');
        unitCell.className = 'unit-cell'; 
        unitCell.textContent = item.unit;
        row.appendChild(unitCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(item.dateAdded).toLocaleDateString();
        row.appendChild(dateCell);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions';

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.title = 'Edit quantity';
        editButton.textContent = 'Edit';
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.title = 'Delete item';
        deleteButton.textContent = 'Delete';
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);
        inventoryTableBody.appendChild(row);
    });
};

    // Fix: Moved function definition up to fix hoisting-related "Cannot find name" error.
    const filterAndRender = () => {
        // Fix: Accessing 'value' on HTMLInputElement is now type-safe.
        const searchTerm = searchBar.value.toLowerCase();
        if (!searchTerm) {
            renderTable(stockItems);
            return;
        }
        const filteredItems = stockItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.unit.toLowerCase().includes(searchTerm)
        );
        renderTable(filteredItems);
    };

    // --- Event Handlers & Actions ---

    const handleAddItem = (e: Event) => {
        e.preventDefault();
        
        // Fix: Accessing 'value' on elements now type-safe.
        const name = itemNameInput.value.trim();
        const category = itemCategoryInput.value.trim();
        const quantity = parseInt(itemQuantityInput.value, 10);
        const unit = itemUnitInput.value;

        if (!name || !category || isNaN(quantity) || quantity < 1) {
            alert('Please fill out all fields correctly.');
            return;
        }

        const newItem: StockItem = {
            id: crypto.randomUUID(),
            name,
            category,
            quantity,
            unit,
            dateAdded: new Date().toISOString(),
        };

        stockItems.push(newItem);
        saveItemsToLocalStorage();
        filterAndRender();
        // Fix: 'reset' method is available on HTMLFormElement.
        addItemForm.reset();
        // Fix: Input value should be a string.
        itemQuantityInput.value = '1'; // Explicitly reset quantity input
    };

    const handleDeleteItem = (id: string) => {
        const itemIndex = stockItems.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            stockItems.splice(itemIndex, 1);
            saveItemsToLocalStorage();
            filterAndRender();
        }
    };
    
    // Fix: Refactored to use DOM API instead of innerHTML to avoid TSX parsing errors.
    const toggleEditMode = (row: HTMLTableRowElement, id: string, isEnteringEditMode: boolean) => {
        isEditing = isEnteringEditMode;
        const quantityCell = row.querySelector('.quantity-cell') as HTMLElement;
        const actionsCell = row.querySelector('.actions') as HTMLElement;
        const item = stockItems.find(i => i.id === id);

        if (isEnteringEditMode) {
            if (quantityCell && actionsCell && item) {
                quantityCell.innerHTML = '';
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'edit-quantity-input';
                input.value = String(item.quantity);
                input.min = "0";
                quantityCell.appendChild(input);

                actionsCell.innerHTML = '';
                const saveBtn = document.createElement('button');
                saveBtn.className = 'save-btn';
                saveBtn.title = 'Save';
                saveBtn.textContent = 'Save';
                actionsCell.appendChild(saveBtn);
                
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'cancel-btn';
                cancelBtn.title = 'Cancel';
                cancelBtn.textContent = 'Cancel';
                actionsCell.appendChild(cancelBtn);
                
                input.focus();
                input.select();
            }
        } else {
            // After saving or canceling, restore the view
            const updatedItem = stockItems.find(i => i.id === id);
            if (quantityCell) {
                quantityCell.textContent = updatedItem ? String(updatedItem.quantity) : '';
            }
            if (actionsCell) {
                actionsCell.innerHTML = '';
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.title = 'Edit quantity';
                editBtn.textContent = 'Edit';
                actionsCell.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.title = 'Delete item';
                deleteBtn.textContent = 'Delete';
                actionsCell.appendChild(deleteBtn);
            }
        }
    };

    const saveQuantity = (row: HTMLTableRowElement, id: string) => {
        const input = row.querySelector('.edit-quantity-input') as HTMLInputElement | null;
        if (!input) return;

        const newQuantity = parseInt(input.value, 10);

        if (isNaN(newQuantity) || newQuantity < 0) {
            alert('Please enter a valid non-negative quantity.');
            return;
        }
        
        const itemIndex = stockItems.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            stockItems[itemIndex].quantity = newQuantity;
            saveItemsToLocalStorage();
        }
        toggleEditMode(row, id, false); // Exit edit mode
    };

    const handleTableClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (!button) return;

        const row = button.closest('tr');
        if (!row) return;

        const id = row.dataset.id;
        if (!id) return;
        
        const classList = button.classList;

        if (classList.contains('delete-btn')) {
            if (isEditing) {
                alert('Please save or cancel the current edit before deleting an item.');
                return;
            }
            handleDeleteItem(id);
        } else if (classList.contains('edit-btn')) {
            if (isEditing) {
                alert('Please save or cancel the current edit first.');
                return;
            }
            toggleEditMode(row, id, true);
        } else if (classList.contains('save-btn')) {
            saveQuantity(row, id);
        } else if (classList.contains('cancel-btn')) {
            toggleEditMode(row, id, false);
        }
    };

    // --- Initialization ---
    
    addItemForm.addEventListener('submit', handleAddItem);
    searchBar.addEventListener('input', filterAndRender);
    inventoryTableBody.addEventListener('click', handleTableClick);

    loadItemsFromLocalStorage();
    filterAndRender();
});
