// src/data/challenges.js
/**
 * Challenge format with multi-language support:
 * {
 *   id: string,
 *   topic: "Loops" | "Recursion" | "Arrays" | "Strings" | ...,
 *   difficulty: "easy" | "medium" | "hard",
 *   title: string,
 *   prompt: string,
 *   functionName: { python, java, javascript, cpp, c },
 *   signature: { python, java, javascript, cpp, c },
 *   starterCode: { python, java, javascript, cpp, c },
 *   solution: { python, java, javascript, cpp, c },
 *   cases: Array<{ args: any[], expected: any, description?: string }>
 * }
 */

const CHALLENGES = [
  {
    id: "loops-sum-array",
    topic: "Loops",
    difficulty: "easy",
    title: "Sum of Array",
    prompt:
      "Write a function that returns the sum of all numbers in the given array.\n\nExamples:\n- sum_array([1,2,3]) -> 6\n- sum_array([]) -> 0",
    functionName: {
      python: "sum_array",
      java: "sumArray",
      javascript: "sumArray",
      cpp: "sumArray",
      c: "sumArray"
    },
    signature: {
      python: "def sum_array(arr):",
      java: "public static int sumArray(int[] arr)",
      javascript: "function sumArray(arr)",
      cpp: "int sumArray(vector<int> arr)",
      c: "int sumArray(int arr[], int size)"
    },
    starterCode: {
      python: `def sum_array(arr):
    # TODO: use a loop to sum all numbers
    total = 0
    for x in arr:
        total += x
    return total
`,
      java: `public class Solution {
    public static int sumArray(int[] arr) {
        // TODO: use a loop to sum all numbers
        int total = 0;
        for (int x : arr) {
            total += x;
        }
        return total;
    }
}
`,
      javascript: `function sumArray(arr) {
    // TODO: use a loop to sum all numbers
    let total = 0;
    for (let x of arr) {
        total += x;
    }
    return total;
}
`,
      cpp: `#include <vector>
using namespace std;

int sumArray(vector<int> arr) {
    // TODO: use a loop to sum all numbers
    int total = 0;
    for (int x : arr) {
        total += x;
    }
    return total;
}
`,
      c: `int sumArray(int arr[], int size) {
    // TODO: use a loop to sum all numbers
    int total = 0;
    for (int i = 0; i < size; i++) {
        total += arr[i];
    }
    return total;
}
`
    },
    solution: {
      python: `def sum_array(arr):
    total = 0
    for x in arr:
        total += x
    return total
`,
      java: `public class Solution {
    public static int sumArray(int[] arr) {
        int total = 0;
        for (int x : arr) {
            total += x;
        }
        return total;
    }
}
`,
      javascript: `function sumArray(arr) {
    return arr.reduce((sum, x) => sum + x, 0);
}
`,
      cpp: `#include <vector>
#include <numeric>
using namespace std;

int sumArray(vector<int> arr) {
    return accumulate(arr.begin(), arr.end(), 0);
}
`,
      c: `int sumArray(int arr[], int size) {
    int total = 0;
    for (int i = 0; i < size; i++) {
        total += arr[i];
    }
    return total;
}
`
    },
    cases: [
      { args: [[]], expected: 0, description: "empty list" },
      { args: [[1, 2, 3]], expected: 6, description: "small positive numbers" },
      { args: [[-1, 5, -2]], expected: 2, description: "includes negatives" },
      { args: [[10, 20, 30, 40]], expected: 100, description: "larger list" },
    ],
  },

  {
    id: "recursion-factorial",
    topic: "Recursion",
    difficulty: "easy",
    title: "Factorial (Recursive)",
    prompt:
      "Write a recursive function that returns n! (n factorial). Assume n is a non-negative integer.\n\nExamples:\n- factorial(0) -> 1\n- factorial(5) -> 120",
    functionName: {
      python: "factorial",
      java: "factorial",
      javascript: "factorial",
      cpp: "factorial",
      c: "factorial"
    },
    signature: {
      python: "def factorial(n):",
      java: "public static long factorial(int n)",
      javascript: "function factorial(n)",
      cpp: "long long factorial(int n)",
      c: "long long factorial(int n)"
    },
    starterCode: {
      python: `def factorial(n):
    # Base case
    if n == 0:
        return 1
    # Recursive case
    return n * factorial(n - 1)
`,
      java: `public class Solution {
    public static long factorial(int n) {
        // Base case
        if (n == 0) {
            return 1;
        }
        // Recursive case
        return n * factorial(n - 1);
    }
}
`,
      javascript: `function factorial(n) {
    // Base case
    if (n === 0) {
        return 1;
    }
    // Recursive case
    return n * factorial(n - 1);
}
`,
      cpp: `long long factorial(int n) {
    // Base case
    if (n == 0) {
        return 1;
    }
    // Recursive case
    return n * factorial(n - 1);
}
`,
      c: `long long factorial(int n) {
    // Base case
    if (n == 0) {
        return 1;
    }
    // Recursive case
    return n * factorial(n - 1);
}
`
    },
    solution: {
      python: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
`,
      java: `public class Solution {
    public static long factorial(int n) {
        if (n == 0) return 1;
        return n * factorial(n - 1);
    }
}
`,
      javascript: `function factorial(n) {
    if (n === 0) return 1;
    return n * factorial(n - 1);
}
`,
      cpp: `long long factorial(int n) {
    if (n == 0) return 1;
    return n * factorial(n - 1);
}
`,
      c: `long long factorial(int n) {
    if (n == 0) return 1;
    return n * factorial(n - 1);
}
`
    },
    cases: [
      { args: [0], expected: 1, description: "zero" },
      { args: [5], expected: 120, description: "five factorial" },
      { args: [3], expected: 6, description: "three factorial" },
    ],
  },

  {
    id: "arrays-max",
    topic: "Arrays",
    difficulty: "medium",
    title: "Maximum in List",
    prompt:
      "Implement a function that returns the maximum number in the array. If the array is empty, return the minimum possible value for that language.",
    functionName: {
      python: "max_in_list",
      java: "maxInList",
      javascript: "maxInList",
      cpp: "maxInList",
      c: "maxInList"
    },
    signature: {
      python: "def max_in_list(arr):",
      java: "public static int maxInList(int[] arr)",
      javascript: "function maxInList(arr)",
      cpp: "int maxInList(vector<int> arr)",
      c: "int maxInList(int arr[], int size)"
    },
    starterCode: {
      python: `def max_in_list(arr):
    if len(arr) == 0:
        return float('-inf')
    m = arr[0]
    for x in arr[1:]:
        if x > m:
            m = x
    return m
`,
      java: `public class Solution {
    public static int maxInList(int[] arr) {
        if (arr.length == 0) {
            return Integer.MIN_VALUE;
        }
        int m = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > m) {
                m = arr[i];
            }
        }
        return m;
    }
}
`,
      javascript: `function maxInList(arr) {
    if (arr.length === 0) {
        return -Infinity;
    }
    let m = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > m) {
            m = arr[i];
        }
    }
    return m;
}
`,
      cpp: `#include <vector>
#include <climits>
using namespace std;

int maxInList(vector<int> arr) {
    if (arr.empty()) {
        return INT_MIN;
    }
    int m = arr[0];
    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] > m) {
            m = arr[i];
        }
    }
    return m;
}
`,
      c: `#include <limits.h>

int maxInList(int arr[], int size) {
    if (size == 0) {
        return INT_MIN;
    }
    int m = arr[0];
    for (int i = 1; i < size; i++) {
        if (arr[i] > m) {
            m = arr[i];
        }
    }
    return m;
}
`
    },
    solution: {
      python: `def max_in_list(arr):
    if len(arr) == 0:
        return float('-inf')
    return max(arr)
`,
      java: `import java.util.Arrays;

public class Solution {
    public static int maxInList(int[] arr) {
        if (arr.length == 0) return Integer.MIN_VALUE;
        return Arrays.stream(arr).max().getAsInt();
    }
}
`,
      javascript: `function maxInList(arr) {
    if (arr.length === 0) return -Infinity;
    return Math.max(...arr);
}
`,
      cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

int maxInList(vector<int> arr) {
    if (arr.empty()) return INT_MIN;
    return *max_element(arr.begin(), arr.end());
}
`,
      c: `#include <limits.h>

int maxInList(int arr[], int size) {
    if (size == 0) return INT_MIN;
    int m = arr[0];
    for (int i = 1; i < size; i++) {
        if (arr[i] > m) m = arr[i];
    }
    return m;
}
`
    },
    cases: [
      { args: [[-5, 10, 2]], expected: 10, description: "mixed negative and positive" },
      { args: [[7]], expected: 7, description: "single element" },
      { args: [[1, 2, 3, 4, 5]], expected: 5, description: "sorted ascending" },
    ],
  },

  {
    id: "strings-reverse",
    topic: "Strings",
    difficulty: "medium",
    title: "Reverse String",
    prompt:
      "Write a function that returns a new string which is the reverse of the input string.",
    functionName: {
      python: "reverse_string",
      java: "reverseString",
      javascript: "reverseString",
      cpp: "reverseString",
      c: "reverseString"
    },
    signature: {
      python: "def reverse_string(s):",
      java: "public static String reverseString(String s)",
      javascript: "function reverseString(s)",
      cpp: "string reverseString(string s)",
      c: "char* reverseString(char* s)"
    },
    starterCode: {
      python: `def reverse_string(s):
    out = ''
    for i in range(len(s) - 1, -1, -1):
        out += s[i]
    return out
`,
      java: `public class Solution {
    public static String reverseString(String s) {
        StringBuilder out = new StringBuilder();
        for (int i = s.length() - 1; i >= 0; i--) {
            out.append(s.charAt(i));
        }
        return out.toString();
    }
}
`,
      javascript: `function reverseString(s) {
    let out = '';
    for (let i = s.length - 1; i >= 0; i--) {
        out += s[i];
    }
    return out;
}
`,
      cpp: `#include <string>
using namespace std;

string reverseString(string s) {
    string out = "";
    for (int i = s.length() - 1; i >= 0; i--) {
        out += s[i];
    }
    return out;
}
`,
      c: `#include <string.h>
#include <stdlib.h>

char* reverseString(char* s) {
    int len = strlen(s);
    char* out = (char*)malloc(len + 1);
    for (int i = 0; i < len; i++) {
        out[i] = s[len - 1 - i];
    }
    out[len] = '\\0';
    return out;
}
`
    },
    solution: {
      python: `def reverse_string(s):
    return s[::-1]
`,
      java: `public class Solution {
    public static String reverseString(String s) {
        return new StringBuilder(s).reverse().toString();
    }
}
`,
      javascript: `function reverseString(s) {
    return s.split('').reverse().join('');
}
`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

string reverseString(string s) {
    reverse(s.begin(), s.end());
    return s;
}
`,
      c: `#include <string.h>
#include <stdlib.h>

char* reverseString(char* s) {
    int len = strlen(s);
    char* out = (char*)malloc(len + 1);
    for (int i = 0; i < len; i++) {
        out[i] = s[len - 1 - i];
    }
    out[len] = '\\0';
    return out;
}
`
    },
    cases: [
      { args: ["hello"], expected: "olleh", description: "regular string" },
      { args: [""], expected: "", description: "empty string" },
      { args: ["racecar"], expected: "racecar", description: "palindrome" },
    ],
  },

  {
    id: "loops-count-vowels",
    topic: "Loops",
    difficulty: "easy",
    title: "Count Vowels",
    prompt:
      "Write a function that returns the number of vowels in the string. Count a, e, i, o, u (both lower and upper case).",
    functionName: {
      python: "count_vowels",
      java: "countVowels",
      javascript: "countVowels",
      cpp: "countVowels",
      c: "countVowels"
    },
    signature: {
      python: "def count_vowels(s):",
      java: "public static int countVowels(String s)",
      javascript: "function countVowels(s)",
      cpp: "int countVowels(string s)",
      c: "int countVowels(char* s)"
    },
    starterCode: {
      python: `def count_vowels(s):
    vowels = set('aeiouAEIOU')
    count = 0
    for ch in s:
        if ch in vowels:
            count += 1
    return count
`,
      java: `public class Solution {
    public static int countVowels(String s) {
        String vowels = "aeiouAEIOU";
        int count = 0;
        for (char ch : s.toCharArray()) {
            if (vowels.indexOf(ch) != -1) {
                count++;
            }
        }
        return count;
    }
}
`,
      javascript: `function countVowels(s) {
    const vowels = new Set('aeiouAEIOU');
    let count = 0;
    for (let ch of s) {
        if (vowels.has(ch)) {
            count++;
        }
    }
    return count;
}
`,
      cpp: `#include <string>
using namespace std;

int countVowels(string s) {
    string vowels = "aeiouAEIOU";
    int count = 0;
    for (char ch : s) {
        if (vowels.find(ch) != string::npos) {
            count++;
        }
    }
    return count;
}
`,
      c: `#include <string.h>

int countVowels(char* s) {
    char* vowels = "aeiouAEIOU";
    int count = 0;
    for (int i = 0; s[i] != '\\0'; i++) {
        if (strchr(vowels, s[i]) != NULL) {
            count++;
        }
    }
    return count;
}
`
    },
    solution: {
      python: `def count_vowels(s):
    return sum(1 for ch in s if ch.lower() in 'aeiou')
`,
      java: `public class Solution {
    public static int countVowels(String s) {
        return (int) s.chars().filter(ch -> "aeiouAEIOU".indexOf(ch) != -1).count();
    }
}
`,
      javascript: `function countVowels(s) {
    return (s.match(/[aeiou]/gi) || []).length;
}
`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

int countVowels(string s) {
    return count_if(s.begin(), s.end(), [](char c) {
        return string("aeiouAEIOU").find(c) != string::npos;
    });
}
`,
      c: `#include <string.h>

int countVowels(char* s) {
    char* vowels = "aeiouAEIOU";
    int count = 0;
    for (int i = 0; s[i]; i++) {
        if (strchr(vowels, s[i])) count++;
    }
    return count;
}
`
    },
    cases: [
      { args: ["hello"], expected: 2, description: "two vowels" },
      { args: [""], expected: 0, description: "empty" },
      { args: ["AEIOU"], expected: 5, description: "uppercase vowels" },
    ],
  },

  {
    id: "recursion-fibonacci",
    topic: "Recursion",
    difficulty: "medium",
    title: "Nth Fibonacci (Recursive)",
    prompt:
      "Write a function that returns the nth Fibonacci number (0-indexed): fib(0)=0, fib(1)=1. Use recursion.",
    functionName: {
      python: "fib",
      java: "fib",
      javascript: "fib",
      cpp: "fib",
      c: "fib"
    },
    signature: {
      python: "def fib(n):",
      java: "public static int fib(int n)",
      javascript: "function fib(n)",
      cpp: "int fib(int n)",
      c: "int fib(int n)"
    },
    starterCode: {
      python: `def fib(n):
    if n == 0:
        return 0
    if n == 1:
        return 1
    return fib(n-1) + fib(n-2)
`,
      java: `public class Solution {
    public static int fib(int n) {
        if (n == 0) return 0;
        if (n == 1) return 1;
        return fib(n - 1) + fib(n - 2);
    }
}
`,
      javascript: `function fib(n) {
    if (n === 0) return 0;
    if (n === 1) return 1;
    return fib(n - 1) + fib(n - 2);
}
`,
      cpp: `int fib(int n) {
    if (n == 0) return 0;
    if (n == 1) return 1;
    return fib(n - 1) + fib(n - 2);
}
`,
      c: `int fib(int n) {
    if (n == 0) return 0;
    if (n == 1) return 1;
    return fib(n - 1) + fib(n - 2);
}
`
    },
    solution: {
      python: `def fib(n):
    if n < 2:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b
`,
      java: `public class Solution {
    public static int fib(int n) {
        if (n < 2) return n;
        int a = 0, b = 1;
        for (int i = 1; i < n; i++) {
            int temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }
}
`,
      javascript: `function fib(n) {
    if (n < 2) return n;
    let [a, b] = [0, 1];
    for (let i = 1; i < n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}
`,
      cpp: `int fib(int n) {
    if (n < 2) return n;
    int a = 0, b = 1;
    for (int i = 1; i < n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}
`,
      c: `int fib(int n) {
    if (n < 2) return n;
    int a = 0, b = 1;
    for (int i = 1; i < n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}
`
    },
    cases: [
      { args: [0], expected: 0, description: "zero" },
      { args: [1], expected: 1, description: "one" },
      { args: [6], expected: 8, description: "sixth" },
    ],
  },

  {
    id: "arrays-two-sum",
    topic: "Arrays",
    difficulty: "hard",
    title: "Two Sum (Indices)",
    prompt:
      "Given an array of integers and a target, return a pair of indices [i, j] such that arr[i] + arr[j] == target. Return null/None if no such pair exists.",
    functionName: {
      python: "two_sum",
      java: "twoSum",
      javascript: "twoSum",
      cpp: "twoSum",
      c: "twoSum"
    },
    signature: {
      python: "def two_sum(nums, target):",
      java: "public static int[] twoSum(int[] nums, int target)",
      javascript: "function twoSum(nums, target)",
      cpp: "vector<int> twoSum(vector<int> nums, int target)",
      c: "int* twoSum(int* nums, int size, int target)"
    },
    starterCode: {
      python: `def two_sum(nums, target):
    # naive approach
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return None
`,
      java: `public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // naive approach
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return null;
    }
}
`,
      javascript: `function twoSum(nums, target) {
    // naive approach
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return null;
}
`,
      cpp: `#include <vector>
using namespace std;

vector<int> twoSum(vector<int> nums, int target) {
    // naive approach
    for (int i = 0; i < nums.size(); i++) {
        for (int j = i + 1; j < nums.size(); j++) {
            if (nums[i] + nums[j] == target) {
                return {i, j};
            }
        }
    }
    return {};
}
`,
      c: `#include <stdlib.h>

int* twoSum(int* nums, int size, int target) {
    // naive approach
    for (int i = 0; i < size; i++) {
        for (int j = i + 1; j < size; j++) {
            if (nums[i] + nums[j] == target) {
                int* result = (int*)malloc(2 * sizeof(int));
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    return NULL;
}
`
    },
    solution: {
      python: `def two_sum(nums, target):
    seen = {}
    for i, v in enumerate(nums):
        need = target - v
        if need in seen:
            return [seen[need], i]
        seen[v] = i
    return None
`,
      java: `import java.util.HashMap;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                return new int[]{seen.get(need), i};
            }
            seen.put(nums[i], i);
        }
        return null;
    }
}
`,
      javascript: `function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (seen.has(need)) {
            return [seen.get(need), i];
        }
        seen.set(nums[i], i);
    }
    return null;
}
`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int> nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) {
            return {seen[need], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}
`,
      c: `#include <stdlib.h>

int* twoSum(int* nums, int size, int target) {
    for (int i = 0; i < size; i++) {
        for (int j = i + 1; j < size; j++) {
            if (nums[i] + nums[j] == target) {
                int* result = (int*)malloc(2 * sizeof(int));
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    return NULL;
}
`
    },
    cases: [
      { args: [[2,7,11,15], 9], expected: [0,1], description: "basic pair at start" },
      { args: [[3,2,4], 6], expected: [1,2], description: "pair in middle/end" },
      { args: [[3,3], 6], expected: [0,1], description: "duplicates" },
      { args: [[1,2,3], 7], expected: null, description: "no valid pair" },
    ],
  },

  {
    id: "strings-is-anagram",
    topic: "Strings",
    difficulty: "easy",
    title: "Is Anagram",
    prompt:
      "Write a function that returns true if string a is an anagram of string b (ignoring spaces and case), otherwise false.",
    functionName: {
      python: "is_anagram",
      java: "isAnagram",
      javascript: "isAnagram",
      cpp: "isAnagram",
      c: "isAnagram"
    },
    signature: {
      python: "def is_anagram(a, b):",
      java: "public static boolean isAnagram(String a, String b)",
      javascript: "function isAnagram(a, b)",
      cpp: "bool isAnagram(string a, string b)",
      c: "int isAnagram(char* a, char* b)"
    },
    starterCode: {
      python: `def is_anagram(a, b):
    a_clean = ''.join(ch.lower() for ch in a if ch.isalnum())
    b_clean = ''.join(ch.lower() for ch in b if ch.isalnum())
    return sorted(a_clean) == sorted(b_clean)
`,
      java: `import java.util.Arrays;

public class Solution {
    public static boolean isAnagram(String a, String b) {
        String aClean = a.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        String bClean = b.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        char[] aArr = aClean.toCharArray();
        char[] bArr = bClean.toCharArray();
        Arrays.sort(aArr);
        Arrays.sort(bArr);
        return Arrays.equals(aArr, bArr);
    }
}
`,
      javascript: `function isAnagram(a, b) {
    const clean = s => s.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('');
    return clean(a) === clean(b);
}
`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

bool isAnagram(string a, string b) {
    string aClean, bClean;
    for (char c : a) if (isalnum(c)) aClean += tolower(c);
    for (char c : b) if (isalnum(c)) bClean += tolower(c);
    sort(aClean.begin(), aClean.end());
    sort(bClean.begin(), bClean.end());
    return aClean == bClean;
}
`,
      c: `#include <string.h>
#include <ctype.h>
#include <stdlib.h>

int compare(const void* a, const void* b) {
    return (*(char*)a - *(char*)b);
}

int isAnagram(char* a, char* b) {
    char aClean[256], bClean[256];
    int ai = 0, bi = 0;
    for (int i = 0; a[i]; i++) {
        if (isalnum(a[i])) aClean[ai++] = tolower(a[i]);
    }
    aClean[ai] = '\\0';
    for (int i = 0; b[i]; i++) {
        if (isalnum(b[i])) bClean[bi++] = tolower(b[i]);
    }
    bClean[bi] = '\\0';
    if (ai != bi) return 0;
    qsort(aClean, ai, sizeof(char), compare);
    qsort(bClean, bi, sizeof(char), compare);
    return strcmp(aClean, bClean) == 0 ? 1 : 0;
}
`
    },
    solution: {
      python: `def is_anagram(a, b):
    from collections import Counter
    a_clean = ''.join(ch.lower() for ch in a if ch.isalnum())
    b_clean = ''.join(ch.lower() for ch in b if ch.isalnum())
    return Counter(a_clean) == Counter(b_clean)
`,
      java: `import java.util.Arrays;

public class Solution {
    public static boolean isAnagram(String a, String b) {
        String aClean = a.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        String bClean = b.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        char[] aArr = aClean.toCharArray();
        char[] bArr = bClean.toCharArray();
        Arrays.sort(aArr);
        Arrays.sort(bArr);
        return Arrays.equals(aArr, bArr);
    }
}
`,
      javascript: `function isAnagram(a, b) {
    const clean = s => s.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('');
    return clean(a) === clean(b);
}
`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

bool isAnagram(string a, string b) {
    string aClean, bClean;
    for (char c : a) if (isalnum(c)) aClean += tolower(c);
    for (char c : b) if (isalnum(c)) bClean += tolower(c);
    sort(aClean.begin(), aClean.end());
    sort(bClean.begin(), bClean.end());
    return aClean == bClean;
}
`,
      c: `#include <string.h>
#include <ctype.h>
#include <stdlib.h>

int compare(const void* a, const void* b) {
    return (*(char*)a - *(char*)b);
}

int isAnagram(char* a, char* b) {
    char aClean[256], bClean[256];
    int ai = 0, bi = 0;
    for (int i = 0; a[i]; i++) {
        if (isalnum(a[i])) aClean[ai++] = tolower(a[i]);
    }
    aClean[ai] = '\\0';
    for (int i = 0; b[i]; i++) {
        if (isalnum(b[i])) bClean[bi++] = tolower(b[i]);
    }
    bClean[bi] = '\\0';
    if (ai != bi) return 0;
    qsort(aClean, ai, sizeof(char), compare);
    qsort(bClean, bi, sizeof(char), compare);
    return strcmp(aClean, bClean) == 0 ? 1 : 0;
}
`
    },
    cases: [
      { args: ["listen", "silent"], expected: true, description: "simple anagram" },
      { args: ["Triangle", "Integral"], expected: true, description: "case-insensitive" },
      { args: ["a gentleman", "elegant man"], expected: true, description: "spaces ignored" },
      { args: ["abc", "abx"], expected: false, description: "not anagram" },
    ],
  },
];

/**
 * Pick a random challenge matching the criteria, with language-specific code.
 */
function pickRandomChallenge({ topic, difficulty, excludeIds, language = "python" } = {}) {
  const lang = normalizeLanguage(language);
  
  let pool = CHALLENGES.filter((c) => {
    if (topic && String(c.topic).toLowerCase() !== String(topic).toLowerCase()) return false;
    if (difficulty && String(c.difficulty).toLowerCase() !== String(difficulty).toLowerCase()) return false;
    if (Array.isArray(excludeIds) && excludeIds.includes(c.id)) return false;
    return true;
  });
  
  if (!pool.length) return null;
  
  const challenge = pool[Math.floor(Math.random() * pool.length)];
  
  // Return the challenge with language-specific code
  return {
    id: challenge.id,
    topic: challenge.topic,
    difficulty: challenge.difficulty,
    title: challenge.title,
    prompt: challenge.prompt,
    functionName: typeof challenge.functionName === 'object' 
      ? (challenge.functionName[lang] || challenge.functionName.python) 
      : challenge.functionName,
    signature: typeof challenge.signature === 'object' 
      ? (challenge.signature[lang] || challenge.signature.python) 
      : challenge.signature,
    starterCode: typeof challenge.starterCode === 'object' 
      ? (challenge.starterCode[lang] || challenge.starterCode.python) 
      : challenge.starterCode,
    solution: typeof challenge.solution === 'object' 
      ? (challenge.solution[lang] || challenge.solution.python) 
      : challenge.solution,
    cases: challenge.cases,
    language: lang
  };
}

function normalizeLanguage(lang = "python") {
  const m = String(lang).toLowerCase();
  if (["py", "python"].includes(m)) return "python";
  if (m === "java") return "java";
  if (["js", "javascript"].includes(m)) return "javascript";
  if (["cpp", "c++"].includes(m)) return "cpp";
  if (m === "c") return "c";
  return "python";
}

function findChallengeById(id, language = "python") {
  const lang = normalizeLanguage(language);
  const challenge = CHALLENGES.find((c) => c.id === id);
  
  if (!challenge) return null;
  
  return {
    id: challenge.id,
    topic: challenge.topic,
    difficulty: challenge.difficulty,
    title: challenge.title,
    prompt: challenge.prompt,
    functionName: typeof challenge.functionName === 'object' 
      ? (challenge.functionName[lang] || challenge.functionName.python) 
      : challenge.functionName,
    signature: typeof challenge.signature === 'object' 
      ? (challenge.signature[lang] || challenge.signature.python) 
      : challenge.signature,
    starterCode: typeof challenge.starterCode === 'object' 
      ? (challenge.starterCode[lang] || challenge.starterCode.python) 
      : challenge.starterCode,
    solution: typeof challenge.solution === 'object' 
      ? (challenge.solution[lang] || challenge.solution.python) 
      : challenge.solution,
    cases: challenge.cases,
    language: lang
  };
}

function getAllChallengesByTopicAndDifficulty(topic, difficulty, language = "python") {
  const lang = normalizeLanguage(language);
  
  return CHALLENGES.filter((c) => {
    if (topic && String(c.topic).toLowerCase() !== String(topic).toLowerCase()) return false;
    if (difficulty && String(c.difficulty).toLowerCase() !== String(difficulty).toLowerCase()) return false;
    return true;
  }).map(challenge => ({
    id: challenge.id,
    topic: challenge.topic,
    difficulty: challenge.difficulty,
    title: challenge.title,
    prompt: challenge.prompt,
    functionName: typeof challenge.functionName === 'object' 
      ? (challenge.functionName[lang] || challenge.functionName.python) 
      : challenge.functionName,
    signature: typeof challenge.signature === 'object' 
      ? (challenge.signature[lang] || challenge.signature.python) 
      : challenge.signature,
    starterCode: typeof challenge.starterCode === 'object' 
      ? (challenge.starterCode[lang] || challenge.starterCode.python) 
      : challenge.starterCode,
    solution: typeof challenge.solution === 'object' 
      ? (challenge.solution[lang] || challenge.solution.python) 
      : challenge.solution,
    cases: challenge.cases,
    language: lang
  }));
}

module.exports = {
  CHALLENGES,
  pickRandomChallenge,
  findChallengeById,
  getAllChallengesByTopicAndDifficulty,
};
