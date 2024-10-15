const request = require('supertest');
const app = require('../../app');
const { connect, disconnect } = require('../../services/mongo');
const { loadPlanetsData } = require("../../models/planets.model");
const api_version = '/v1'

describe('Test Launches API', () => {
  beforeAll( async () => {
    await connect();
    await loadPlanetsData();
  });

  describe('Test GET /launches', () => {
    test('It should respond with 200 success', async () => {
      const response = await request(app)
          .get(`${api_version}/launches`)
          .expect(200)
          .expect('Content-Type', /json/);
    });
  });

  describe('Test POST /launches', () => {
    const testLaunchId = 99;
    const data = {
      mission: 'Test mission',
      rocket: 'Test rocket',
      target: 'Kepler-62 f', // actual planet for validation
      launchDate: 'January 4, 2028', // valid date for validation
      test: testLaunchId,
    };
    test('It should respond with 201 created', async () => {
      const response = await request(app)
          .post(`${api_version}/launches`)
          .send(data)
          .expect(201)
          .expect('Content-Type', /json/);

      const testLaunch = { ...data };
      testLaunch.launchDate = new Date(testLaunch.launchDate).toISOString();
      expect(response.body).toMatchObject(testLaunch);
    });
    test('It should catch missing required properties', async () => {
      const testLaunch = { ...data };
      testLaunch.mission = '';
      const response = await request(app)
          .post(`${api_version}/launches`)
          .send(testLaunch)
          .expect(400)
          .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        error: 'Some parameters are missing'
      });
    });
    test('It should catch invalid dates', async () => {
      const testLaunch = { ...data };
      testLaunch.launchDate = 'tomorrow';
      const response = await request(app)
          .post(`${api_version}/launches`)
          .send(testLaunch)
          .expect(400)
          .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        error: 'Invalid launch date'
      });
    });
    test('It should catch invalid target planets', async () => {
      const testLaunch = { ...data };
      testLaunch.target = 'Not valid planet name';
      const response = await request(app)
          .post(`${api_version}/launches`)
          .send(testLaunch)
          .expect(400)
          .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        error: 'No matching planet found'
      });
    });
    test('It should delete data by id', async () => {
      const response = await request(app)
          .delete(`${api_version}/launches/${testLaunchId}`)
          .expect(200)
          .expect('Content-Type', /json/);

      expect(response.body.ok).toBe(true);
    });
  });

  afterAll(async () => {
    await disconnect();
  });
})