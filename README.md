# Diett - Diet Planner Application
## Flow plan
### Signing In/ Signup
- **Type:** Email + password signup
- Signup triggers Supabase auth addition flow, `user` role granted
### Meal Planning
1. **Scanning Meal for Nutritional Information** (`v1` iteration):
    - User scans the meal via their camera from the "Plan my Meal" tab, sends it to the **_inference api_** for **_identification_**
    - User can add it to their **_meal timetable_** or just take information regarding the meal to better prune it to meet their health goals
2. **Meal planning from menu** (`v2` iteration):
    - Menu sreenshot can be sent to **_inference api_** to retreive an **_information string_** (text extracted from menu via OCR or by processing documents)
    - **_Information string_** can be used to develop meal timetable
### Setting Dietary Goals (`v1.1` iteration)
- Set goals from any of these:
    - **_Weight loss_**
    - **_Weight gain_**
    - **_Maintain weight_**
    - **_Muscle gain_**

### Track Diet and Physical Activity
- Logging utility (`v1.1` iteration) 

## Development Resources:
1. [Supabase Community - `supabase-go` package](https://github.com/supabase-community/supabase-go)
2. [Medium.com - Accelerating your Golang backend with Supabase API](https://medium.com/@lengzuo/accelerating-your-golang-backend-with-supabase-api-23bd377cbae6)
3. [Hashnode - Lightning Fast APIs: Building Golang CRUD Endpoints with Supabase⚡️](https://ryanm.hashnode.dev/lightning-fast-apis-building-golang-crud-endpoints-with-supabase)
4. [How to Dockerize a React App: A Step-by-Step Guide for Developers](https://www.docker.com/blog/how-to-dockerize-react-app/)
5. [Fine-Tuning a Pre-Trained ResNet-18 Model for Image Classification on Custom Dataset with PyTorch](https://medium.com/@imabhi1216/fine-tuning-a-pre-trained-resnet-18-model-for-image-classification-on-custom-dataset-with-pytorch-02df12e83c2c)

## Iteration Tracking:
1. `v1`:
    - Auth
    - Meal planning using scanner
2. `v1.1`:
    - Set dietary goals
    - Track diet and physical activity
3. `v2`:
    - Meal planning from menu