<template>
    <div class="container mt-5">
        <h1 class="text-center">Tehtävät</h1>
        <ul class="list-group">
            <li
                v-for="task in tasks"
                :key="task.id"
                :class="[
                    'list-group-item',
                    { 'list-group-item-success': task.completed },
                ]"
            >
                <div class="d-flex justify-content-between align-items-center">
                    <span
                        :class="{
                            'text-decoration-line-through': task.completed,
                        }"
                        >{{ task.title }} | {{ task.description }}</span
                    >
                    <div>
                        <button
                            class="btn btn-success btn-sm me-2"
                            @click="markAsCompleted(task)"
                            :disabled="task.completed"
                        >
                            Valmis
                        </button>
                        <button
                            class="btn btn-danger btn-sm"
                            @click="deleteTask(task)"
                        >
                            Poista
                        </button>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    data() {
        return {
            tasks: [],
        };
    },
    created() {
        axios
            .get("/api/tasks")
            .then((response) => {
                this.tasks = response.data;
            })
            .catch((error) => {
                console.error("Error fetching tasks:", error);
            });
    },
    methods: {
        markAsCompleted(task) {
            axios
                .put(`/api/tasks/${task.id}`, { completed: true })
                .then((response) => {
                    task.completed = true;
                });
        },
        deleteTask(task) {
            axios.delete(`/api/tasks/${task.id}`).then((response) => {
                this.tasks = this.tasks.filter((t) => t.id !== task.id);
            });
        },
    },
};
</script>

<style scoped>
.text-decoration-line-through {
    text-decoration: line-through;
}
</style>
