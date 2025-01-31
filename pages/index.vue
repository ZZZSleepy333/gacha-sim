<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h2 class="text-2xl font-bold mb-4 text-center">Pick a banner to roll</h2>

    <!-- Danh sách Banners -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div
        v-for="banner in banners"
        :key="banner._id"
        class="cursor-pointer border rounded-lg p-3 shadow-md transition duration-300 hover:shadow-lg"
        :class="
          selectedBanner && selectedBanner._id === banner._id
            ? 'border-blue-500 bg-blue-100'
            : 'bg-white'
        "
        @click="selectBanner(banner)"
      >
        <img
          :src="banner.imageUrl"
          alt="Banner"
          class="w-full h-32 object-cover rounded"
        />
        <p class="text-center mt-2 font-semibold">{{ banner.name }}</p>
      </div>
    </div>

    <!-- Hiển thị số lần quay -->
    <p class="text-lg font-semibold text-center mt-2">
      Transient stones spent: {{ rollCount }}
      <img
        src="/public/icon_item_stone.png "
        alt="Stone"
        class="w-6 h-6 inline-block"
      />
    </p>

    <!-- Danh sách Kết Quả -->
    <h2 class="text-xl font-bold mb-8 text-center">Congratulations! You got</h2>
    <div class="grid grid-cols-5 gap-4">
      <div v-for="(char, name) in rollResults" :key="name" class="">
        <a :href="char.link" target="_blank">
          <img
            :src="char.image"
            alt="Character"
            class="w-24 h-24 object-cover rounded-lg shadow-md"
          />
        </a>
        <p class="mt-2 font-semibold">{{ char.name }}</p>
      </div>
    </div>

    <!-- Nút Roll -->
    <div v-if="selectedBanner" class="flex justify-center space-x-4 mb-6 mt-6">
      <button
        @click="roll(1)"
        class="bg-blue-500 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-600"
      >
        Roll x1
      </button>
      <button
        @click="roll(10)"
        class="bg-green-500 text-white px-5 py-2 rounded-lg shadow-md hover:bg-green-600"
      >
        Roll x10
      </button>
    </div>

    <!-- Lịch sử Roll -->
    <h2 class="text-xl font-bold mb-4 text-center">History</h2>
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-yellow-100 p-4 rounded-lg shadow-md">
        <h3 class="font-bold text-lg text-yellow-600">⭐ Rate-up</h3>
        <ul>
          <li
            v-for="(char, name) in rollHistory.rateUp"
            :key="name"
            :class="
              char.rarity === 5
                ? 'text-red-500 font-bold'
                : char.rarity === 4
                ? 'text-purple-500 font-semibold'
                : 'text-gray-500'
            "
          >
            {{ char.name }} x{{ char.count }}
          </li>
        </ul>
      </div>

      <div
        class="bg-orange-100 p-4 rounded-lg shadow-md text-gray-500 font-bold"
      >
        <h3 class="font-bold text-lg text-orange-600">✨ 5★ Off-Rate</h3>
        <ul>
          <li v-for="(char, name) in rollHistory.fiveStar" :key="name">
            {{ char.name }} x{{ char.count }}
          </li>
        </ul>
      </div>

      <div
        class="bg-purple-100 p-4 rounded-lg shadow-md text-gray-500 font-semibold"
      >
        <h3 class="font-bold text-lg text-purple-600">🌟 4★ Off-Rate</h3>
        <ul>
          <li v-for="(char, name) in rollHistory.fourStar" :key="name">
            {{ char.name }} x{{ char.count }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useFetch } from "#app";

const banners = ref([]);
const selectedBanner = ref(null);
const rollResults = ref({});
const rollCount = ref(0);

const rollHistory = ref({
  rateUp: {},
  fiveStar: {},
  fourStar: {},
});

const config = useRuntimeConfig();
const baseURL = config.public.apiBase;

const fetchBanners = async () => {
  try {
    const response = await useFetch("/api/get_banners", {
      baseURL,
    });
    if (!response.ok) throw new Error("Không thể fetch banners");

    const data = await response.json();
    console.log("Dữ liệu banners nhận được:", data); // Debug

    banners.value = data || [];
  } catch (error) {
    console.error("Lỗi khi fetch banners:", error);
  }
};
const selectBanner = (banner) => {
  selectedBanner.value = banner;
  rollResults.value = []; // Reset kết quả khi đổi banner
};

const roll = (count) => {
  rollCount.value = rollCount.value + count * 5;
  console.log("rollCount", rollCount.value);
  if (!selectedBanner.value) return;

  let results = [];
  const characters = selectedBanner.value.characters;
  //rollCount += count;

  for (let i = 0; i < count; i++) {
    let rarityChance = Math.random() * 100;
    let rarity = 3;
    console.log("rarity", rarityChance);
    if (i === 9) {
      rarityChance = Math.random() * 100;

      rarity = rarityChance < 96 ? 4 : 5;
    } else {
      if (rarityChance < 2) rarity = 5;
      else if (rarityChance < 18) rarity = 4;
    }

    const rarityPool = characters.filter((char) => char.rarity === rarity);
    let chosenChar;
    if (rarityPool.length > 0) {
      const rateUpPool = rarityPool.filter((char) => char.rateUp);
      if (rarity === 5) {
        chosenChar =
          Math.random() * 100 < 70 && rateUpPool.length > 0
            ? rateUpPool[Math.floor(Math.random() * rateUpPool.length)]
            : rarityPool[Math.floor(Math.random() * rarityPool.length)];
      } else if (rarity === 4) {
        chosenChar =
          Math.random() * 100 < rateUpPool.length * 10 && rateUpPool.length > 0
            ? rateUpPool[Math.floor(Math.random() * rateUpPool.length)]
            : rarityPool[Math.floor(Math.random() * rarityPool.length)];
      } else {
        chosenChar =
          Math.random() * 100 < (rateUpPool.length - 1) * 10 &&
          rateUpPool.length > 0
            ? rateUpPool[Math.floor(Math.random() * rateUpPool.length)]
            : rarityPool[Math.floor(Math.random() * rarityPool.length)];
      }
    }

    if (chosenChar) {
      const existingChar = results.find(
        (char) => char.name === chosenChar.name
      );
      if (existingChar) {
        existingChar.count++;
      }
      results.push({
        name: chosenChar.name,
        image: chosenChar.imgSrc,
        link: chosenChar.link,
        count: 1,
        rateUp: chosenChar.rateUp,
        rarity: chosenChar.rarity,
      });
    }
  }
  rollResults.value = results;

  console.log("Kết quả Roll:", rollResults.value); // Debug
  rollHistory.value = results.reduce(
    (acc, char) => {
      console.log("char", char);

      if (char.rateUp) {
        acc.rateUp[char.name] = acc.rateUp[char.name]
          ? { ...char, count: acc.rateUp[char.name].count + 1 }
          : { ...char, count: 1 };
      } else if (char.name.includes("5")) {
        acc.fiveStar[char.name] = acc.fiveStar[char.name]
          ? { ...char, count: acc.fiveStar[char.name].count + 1 }
          : { ...char, count: 1 };
      } else if (char.name.includes("4")) {
        acc.fourStar[char.name] = acc.fourStar[char.name]
          ? { ...char, count: acc.fourStar[char.name].count + 1 }
          : { ...char, count: 1 };
      }

      return acc;
    },
    // 🛠 Giữ lại lịch sử cũ bằng cách lấy giá trị cũ làm `initialValue`
    {
      rateUp: { ...rollHistory.value.rateUp },
      fiveStar: { ...rollHistory.value.fiveStar },
      fourStar: { ...rollHistory.value.fourStar },
    }
  );
};

onMounted(fetchBanners);
</script>

<style scoped></style>
