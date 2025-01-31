<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Popup thông báo -->
    <div
      v-if="showMessage"
      class="fixed top-5 right-5 bg-gray-800 text-white px-4 py-2 rounded shadow-lg"
    >
      {{ saveMessage }}
    </div>
    <!-- Nút Lưu -->
    <button
      class="bg-blue-500 text-white px-4 py-2 rounded mb-4 flex items-center justify-center"
      :class="isSaving ? 'opacity-50 cursor-not-allowed' : ''"
      :disabled="isSaving"
      @click="saveInfo"
    >
      <span v-if="isSaving" class="animate-spin mr-2">🔄</span>
      {{ isSaving ? "Đang lưu..." : "Lưu thông tin" }}
    </button>

    <!-- Upload Ảnh -->
    <div class="mb-4">
      <label class="block mb-2 font-semibold">Upload ảnh:</label>
      <input type="file" @change="uploadImage" class="border p-2 w-full" />
    </div>

    <!-- Điền Tên -->
    <div class="mb-4">
      <label class="block mb-2 font-semibold">Tên:</label>
      <input
        v-model="bannerName"
        type="text"
        class="border p-2 w-full"
        placeholder="Nhập tên banner"
      />
    </div>

    <!-- Thanh Tìm Kiếm -->
    <div class="mb-4">
      <input
        v-model="searchTerm"
        type="text"
        class="border p-2 w-full"
        placeholder="Tìm kiếm nhân vật..."
      />
    </div>

    <!-- Danh sách Nhân Vật -->
    <div class="grid grid-cols-4 gap-4">
      <div v-for="(characters, tag) in filteredCharactersByTag" :key="tag">
        <h3 class="font-bold text-lg mb-2">{{ tag }}</h3>

        <!-- Nút Chọn Tất Cả -->
        <button
          class="text-white px-3 py-1 rounded mb-2"
          :class="areAllSelected(tag) ? 'bg-red-500' : 'bg-blue-500'"
          @click="toggleSelectAll(tag)"
        >
          {{ areAllSelected(tag) ? "Bỏ Chọn Tất Cả" : "Chọn Tất Cả" }}
        </button>

        <div
          v-for="char in characters"
          :key="char.name"
          class="flex items-center justify-between border p-2 mb-2 rounded"
        >
          <span>{{ char.name }}</span>
          <div class="flex space-x-2">
            <button
              class="px-2 py-1 rounded text-white"
              :class="
                selectedCharacters[char.name] ? 'bg-red-500' : 'bg-green-500'
              "
              @click="toggleCharacter(char)"
            >
              {{ selectedCharacters[char.name] ? "Xóa" : "Thêm" }}
            </button>
            <button
              v-if="selectedCharacters[char.name]"
              class="px-2 py-1 text-white rounded"
              :class="
                selectedCharacters[char.name].rateUp
                  ? 'bg-orange-500'
                  : 'bg-gray-500'
              "
              @click="toggleRateUp(char.name)"
            >
              {{
                selectedCharacters[char.name].rateUp ? "Bỏ Rate-up" : "Rate-up"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const bannerName = ref("");
const searchTerm = ref("");
const characters = ref([]);
const selectedCharacters = ref({});
const rateUpCharacters = ref({});

const isSaving = ref(false);
const saveMessage = ref("");
const showMessage = ref(false);

// ✅ Fetch nhân vật từ API
const fetchCharacters = async () => {
  try {
    const response = await fetch("http://localhost:3001/api/characters");
    const data = await response.json();
    console.log("Dữ liệu nhận được:", data);
    characters.value = data || [];
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu nhân vật:", error);
  }
};

// ✅ Lọc danh sách nhân vật theo tags + search
const filteredCharactersByTag = computed(() => {
  const grouped = {};
  characters.value.forEach((char) => {
    if (
      !searchTerm.value ||
      char.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    ) {
      char.tags.forEach((tag) => {
        if (!grouped[tag]) grouped[tag] = [];
        grouped[tag].push(char);
      });
    }
  });
  return grouped;
});

// ✅ Toggle chọn 1 nhân vật
const toggleCharacter = (char) => {
  if (selectedCharacters.value[char.name]) {
    delete selectedCharacters.value[char.name];
    delete rateUpCharacters.value[char.name];
  } else {
    selectedCharacters.value[char.name] = { ...char, rateUp: false };
  }
};

// ✅ Toggle Rate-up
const toggleRateUp = (charName) => {
  if (selectedCharacters.value[charName]) {
    selectedCharacters.value[charName].rateUp =
      !selectedCharacters.value[charName].rateUp;
  }
};

// ✅ Kiểm tra xem tất cả nhân vật trong tag có được chọn không
const areAllSelected = (tag) => {
  const chars = filteredCharactersByTag.value[tag] || [];
  return (
    chars.length > 0 &&
    chars.every((char) => selectedCharacters.value[char.name])
  );
};

// ✅ Toggle chọn tất cả nhân vật trong 1 tag
const toggleSelectAll = (tag) => {
  const chars = filteredCharactersByTag.value[tag] || [];
  const allSelected = areAllSelected(tag);

  chars.forEach((char) => {
    if (allSelected) {
      delete selectedCharacters.value[char.name];
      delete rateUpCharacters.value[char.name];
    } else {
      selectedCharacters.value[char.name] = { ...char, rateUp: false };
    }
  });
};

const saveInfo = async () => {
  if (isSaving.value) return; // Tránh spam
  isSaving.value = true;
  saveMessage.value = "";
  showMessage.value = false;

  const formData = new FormData();
  formData.append("name", bannerName.value);
  formData.append(
    "characters",
    JSON.stringify(Object.values(selectedCharacters.value))
  );

  if (selectedImage.value) {
    formData.append("image", selectedImage.value);
  }

  try {
    const response = await fetch("http://localhost:3001/api/banners", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log("✅ Kết quả lưu:", result);
    saveMessage.value = "Lưu thành công!";
  } catch (error) {
    console.error("❌ Lỗi khi lưu banner:", error);
    saveMessage.value = "Lưu thất bại!";
  } finally {
    isSaving.value = false;
    showMessage.value = true;

    setTimeout(() => {
      showMessage.value = false;
    }, 3000); // Ẩn sau 3 giây
  }
};

// ✅ Sửa `uploadImage()`
const selectedImage = ref(null);

const uploadImage = (event) => {
  selectedImage.value = event.target.files[0];
  console.log("📸 Ảnh tải lên:", selectedImage.value);
};

onMounted(fetchCharacters);
</script>
