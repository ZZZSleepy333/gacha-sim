<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto">
    <h2 class="text-xl md:text-2xl font-bold mb-4 text-center">
      Pick a banner to roll
    </h2>

    <!-- Danh sách Banners -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="banner in banners"
        :key="banner._id"
        class="cursor-pointer border rounded-lg p-2 md:p-3 shadow-md transition duration-300 hover:shadow-lg"
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
          class="w-full h-24 md:h-32 object-cover rounded"
        />
        <p class="text-center mt-2 font-semibold text-sm md:text-base">
          {{ banner.name }}
        </p>
      </div>
    </div>

    <!-- Hiển thị số lần quay -->
    <p class="text-base md:text-lg font-semibold text-center mt-2">
      Transient stones spent: {{ rollCount }}
      <img
        src="/public/icon_item_stone.png"
        alt="Stone"
        class="w-5 h-5 md:w-6 md:h-6 inline-block"
      />
    </p>

    <!-- Danh sách Kết Quả -->
    <h2 class="text-lg md:text-xl font-bold mb-6 text-center">
      Congratulations! You got
    </h2>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
      <div
        v-for="(char, name) in rollResults"
        :key="name"
        class="flex flex-col items-center p-2 rounded-lg shadow-md"
        :class="
          char.rarity === 5
            ? 'bg-red-500 text-white'
            : char.rarity === 4 && char.rateUp
            ? 'bg-purple-500 text-white'
            : 'text-gray-500'
        "
      >
        <a
          :href="'https://housamo-skill.netlify.app' + char.link"
          target="_blank"
          class="flex justify-center"
        >
          <img
            :src="char.image"
            alt="Character"
            class="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg shadow-md"
          />
        </a>
        <p class="mt-1 md:mt-2 font-semibold text-xs md:text-sm text-center">
          {{ char.name }}
        </p>
      </div>
    </div>

    <!-- Nút Roll -->
    <div
      v-if="selectedBanner"
      class="flex justify-center space-x-3 md:space-x-4 mb-4 md:mb-6 mt-4 md:mt-6"
    >
      <button
        @click="roll(1)"
        class="bg-blue-500 text-white px-4 py-2 md:px-5 md:py-2 rounded-lg shadow-md hover:bg-blue-600"
      >
        Roll x1
      </button>
      <button
        @click="roll(10)"
        class="bg-green-500 text-white px-4 py-2 md:px-5 md:py-2 rounded-lg shadow-md hover:bg-green-600"
      >
        Roll x10
      </button>
    </div>

    <!-- Lịch sử Roll -->
    <h2 class="text-lg md:text-xl font-bold mb-4 text-center">History</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      <div
        class="bg-yellow-100 p-3 md:p-4 rounded-lg shadow-md text-sm md:text-base"
      >
        <h3 class="font-bold text-yellow-600">⭐ Rate-up</h3>
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
            {{ char.name }} SA.LV {{ char.count }}
          </li>
        </ul>
      </div>

      <div
        class="bg-orange-100 p-3 md:p-4 rounded-lg shadow-md text-gray-500 font-bold text-sm md:text-base"
      >
        <h3 class="font-bold text-orange-600">✨ 5★ Off-Rate</h3>
        <ul>
          <li v-for="(char, name) in rollHistory.fiveStar" :key="name">
            {{ char.name }} SA.LV {{ char.count }}
          </li>
        </ul>
      </div>

      <div
        class="bg-purple-100 p-3 md:p-4 rounded-lg shadow-md text-gray-500 font-semibold text-sm md:text-base"
      >
        <h3 class="font-bold text-purple-600">🌟 4★ Off-Rate</h3>
        <ul>
          <li v-for="(char, name) in rollHistory.fourStar" :key="name">
            {{ char.name }} SA.LV {{ char.count }}
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
  threeStar: {},
});

const fetchBanners = async () => {
  try {
    const response = await fetch("/api/banners");
    if (!response.ok) throw new Error("Không thể fetch banners");

    const data = await response.json();

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
  rollCount.value += count * 5;

  if (!selectedBanner.value) return;

  let results = [];
  const characters = selectedBanner.value.characters;

  for (let i = 0; i < count; i++) {
    let rarityChance = Math.random() * 100;
    let rarity = 3;

    // Xác định tỷ lệ rớt sao dựa trên vị trí roll
    if (i === 9) {
      rarityChance = Math.random() * 100;
      rarity = rarityChance < 96 ? 4 : 5;
    } else {
      if (rarityChance < 2) rarity = 5;
      else if (rarityChance < 20) rarity = 4;
    }

    // Lọc danh sách nhân vật theo sao
    const rarityPool = characters.filter((char) => {
      const historyCount =
        (rollHistory.value.rateUp[char.name]?.count || 0) +
        (rollHistory.value.fiveStar[char.name]?.count || 0) +
        (rollHistory.value.fourStar[char.name]?.count || 0) +
        (rollHistory.value.threeStar[char.name]?.count || 0);
      return char.rarity === rarity && historyCount < 100;
    });

    if (rarityPool.length === 0) continue; // Nếu không còn nhân vật hợp lệ, bỏ qua lượt roll

    let chosenChar;
    const rateUpPool = rarityPool.filter((char) => char.rateUp);
    const nonRateUpPool = rarityPool.filter((char) => !char.rateUp);

    // Tính toán tỷ lệ rơi theo số lượng nhân vật rate-up
    let rateUpChance = 0;
    let nonRateUpChance = 0;

    if (rarity === 5) {
      if (i === 9) {
        rateUpChance = 1.459 * rateUpPool.length;
        nonRateUpChance = (4 - rateUpChance) / (nonRateUpPool.length || 1);
      } else {
        rateUpChance = 0.729 * rateUpPool.length;
        nonRateUpChance = (2 - rateUpChance) / (nonRateUpPool.length || 1);
      }
    } else if (rarity === 4) {
      if (i === 9) {
        rateUpChance = 9.549 * rateUpPool.length;
        nonRateUpChance = (96 - rateUpChance) / (nonRateUpPool.length || 1);
      } else {
        rateUpChance = 1.789 * rateUpPool.length;
        nonRateUpChance = (18 - rateUpChance) / (nonRateUpPool.length || 1);
      }
      rateUpChance = 1.789 * rateUpPool.length;
      nonRateUpChance = (18 - rateUpChance) / (nonRateUpPool.length || 1);
    } else {
      rateUpChance = 6.35 * rateUpPool.length;
      nonRateUpChance = (80 - rateUpChance) / (nonRateUpPool.length || 1);
    }

    // Chọn nhân vật dựa trên tỷ lệ mới
    const rollRate = Math.random() * 100;
    if (rateUpPool.length > 0 && rollRate < rateUpChance) {
      chosenChar = rateUpPool[Math.floor(Math.random() * rateUpPool.length)];
    } else {
      chosenChar =
        nonRateUpPool[Math.floor(Math.random() * nonRateUpPool.length)];
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
        link: chosenChar.href,
        count: 1,
        rateUp: chosenChar.rateUp,
        rarity: chosenChar.rarity,
      });
    }
  }

  // Cập nhật lịch sử roll
  rollResults.value = results;
  rollHistory.value = results.reduce(
    (acc, char) => {
      const historyCount =
        (rollHistory.value.rateUp[char.name]
          ? rollHistory.value.rateUp[char.name].count
          : 0) +
        (rollHistory.value.fiveStar[char.name]
          ? rollHistory.value.fiveStar[char.name].count
          : 0) +
        (rollHistory.value.fourStar[char.name]
          ? rollHistory.value.fourStar[char.name].count
          : 0) +
        (rollHistory.value.threeStar[char.name]
          ? rollHistory.value.threeStar[char.name].count
          : 0);

      if (historyCount < 100) {
        if (char.rateUp) {
          if (char.rarity === 5) {
            acc.rateUp[char.name] = acc.rateUp[char.name]
              ? { ...char, count: acc.rateUp[char.name].count + 20 }
              : { ...char, count: 1 };
            if (acc.rateUp[char.name].count >= 100) {
              acc.rateUp[char.name].count = 100;
            }
          } else if (char.rarity === 4) {
            acc.rateUp[char.name] = acc.rateUp[char.name]
              ? { ...char, count: acc.rateUp[char.name].count + 5 }
              : { ...char, count: 1 };
            if (acc.rateUp[char.name].count >= 100) {
              acc.rateUp[char.name].count = 100;
            }
          } else {
            acc.rateUp[char.name] = acc.rateUp[char.name]
              ? { ...char, count: acc.rateUp[char.name].count + 1 }
              : { ...char, count: 1 };
            if (acc.rateUp[char.name].count >= 100) {
              acc.rateUp[char.name].count = 100;
            }
          }
        } else if (char.rarity === 5) {
          acc.fiveStar[char.name] = acc.fiveStar[char.name]
            ? { ...char, count: acc.fiveStar[char.name].count + 20 }
            : { ...char, count: 1 };
          if (acc.fiveStar[char.name].count >= 100) {
            acc.fiveStar[char.name].count = 100;
          }
        } else if (char.rarity === 4) {
          acc.fourStar[char.name] = acc.fourStar[char.name]
            ? { ...char, count: acc.fourStar[char.name].count + 5 }
            : { ...char, count: 1 };
          if (acc.fourStar[char.name].count >= 100) {
            acc.fourStar[char.name].count = 100;
          }
        } else {
          acc.threeStar[char.name] = acc.threeStar[char.name]
            ? { ...char, count: acc.threeStar[char.name].count + 1 }
            : { ...char, count: 1 };
          if (acc.threeStar[char.name].count >= 100) {
            acc.threeStar[char.name].count = 100;
          }
        }
      }
      return acc;
    },
    {
      rateUp: { ...rollHistory.value.rateUp },
      fiveStar: { ...rollHistory.value.fiveStar },
      fourStar: { ...rollHistory.value.fourStar },
      threeStar: { ...rollHistory.value.threeStar },
    }
  );
};

onMounted(fetchBanners);
</script>

<style scoped></style>
