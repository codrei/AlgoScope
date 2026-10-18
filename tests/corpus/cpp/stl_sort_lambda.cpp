#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;

struct Student {
    string name;
    int grade;
};

bool byGradeDesc(const Student& a, const Student& b) {
    return a.grade > b.grade;
}

int main() {
    vector<int> nums = {42, 7, 19, 3, 25};
    sort(nums.begin(), nums.end());
    for (int x : nums) cout << x << " ";
    cout << endl;

    sort(nums.begin(), nums.end(), greater<int>());
    for (int x : nums) cout << x << " ";
    cout << endl;

    vector<Student> cls = {{"Ana", 88}, {"Ben", 95}, {"Cy", 72}, {"Di", 91}};
    sort(cls.begin(), cls.end(), byGradeDesc);
    for (const auto& s : cls) cout << s.name << ":" << s.grade << " ";
    cout << endl;

    sort(cls.begin(), cls.end(), [](const Student& a, const Student& b) { return a.name > b.name; });
    for (auto& s : cls) cout << s.name << " ";
    cout << endl;

    vector<pair<int, int>> pts = {{3, 1}, {1, 2}, {2, 0}};
    sort(pts.begin(), pts.end(), [](pair<int, int> a, pair<int, int> b) { return a.second < b.second; });
    for (auto p : pts) cout << "(" << p.first << "," << p.second << ") ";
    cout << endl;

    int count = count_if(nums.begin(), nums.end(), [](int x) { return x > 10; });
    cout << "Greater than 10: " << count << endl;
    auto it = find(nums.begin(), nums.end(), 19);
    cout << "19 at index " << (it - nums.begin()) << endl;
    reverse(nums.begin(), nums.end());
    cout << "Max: " << *max_element(nums.begin(), nums.end()) << ", first after reverse: " << nums[0] << endl;
    return 0;
}
