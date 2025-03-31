<template>
    <div class="container mt-5">
        <form @submit.prevent="submitForm">
            <div class="form-header"><h2>Task Creation</h2></div>
            <div class="mb-3">
                <label for="task-title" class="form-label">Title</label>
                <input
                    type="text"
                    class="form-control"
                    id="task-title"
                    v-model="title"
                    required
                />
            </div>
            <div class="mb-3">
                <label for="task-description" class="form-label"
                    >Description</label
                >
                <input
                    type="text"
                    class="form-control"
                    id="task-description"
                    v-model="description"
                    required
                />
            </div>
            <button type="submit" class="btn btn-primary">Submit</button>
        </form>
    </div>
</template>

<script>
export default {
    data() {
        return {
            title: "",
            description: "",
        };
    },
    methods: {
        submitForm() {
            console.log(this.title, this.description);
            axios
                .post("/api/tasks", {
                    title: this.title,
                    description: this.description,
                })
                .then((response) => {
                    this.title = "";
                    this.description = "";
                    alert("Task created successfully!");
                })
                .catch((error) => {
                    console.error("There was an error!", error);
                });
        },
    },
};
</script>
