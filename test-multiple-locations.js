const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Base URL for API
const API_BASE_URL = 'http://localhost:10000';

// Access code for authentication (from environment variable)
const ACCESS_CODE = process.env.ACCESS_CODE;

// Two different sample base64 images for testing
const SAMPLE_IMAGE_1 = 'data:image/jpeg;base64,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';
const SAMPLE_IMAGE_2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigAooooAKK+Mf27f+CiOl/s86sPDnh3T7bxJ46kgjurtJ7mSLT9JgkJEUlwyxtJJLLsdo4YghKxyM88e6L4fh6R/+Dj7ULPVtRvrP4l/BSGTw0bmaVJLrw9rmoCfT0Q/NGIpQ08i4Py/aEOM+Zjd8FTzhVMXPL44eVWMnGE7rld9mlJXb20W++nQ+ijw5Kph/rMa0acja3Ld2b0Vm7dXZ9Ln6s0V+M91/wAHIkq3Uit8E4jbBiFUeImEjIDwrMYAFJHcLj0Br3r9hD/gqZqH7YnjDUfCeveELfwlqtlp66/ZvpmoyahDqOnPcG0laOSWGJoZY5wqsMsjRyxsrrlQ/VhONMtxdWNCi5c7S5W4SVnJN2bi7LTtc48XwfmeEpOtXUXFauylfSLb0Tdlo9Nz7soryrwT+0l4E8ceMtQ8OaX4q0XUNa0i7msb+1t7tJZLWaGbyvPQAfMIZDskGMpJlH2uquPVa+mo1qdaCqUpKUZbNbP/AIB8ziMPVw1R0q0XGS3T3X/A1CiiitDIKKKKACqs97BbyBJJo43b7qswBP0B5qXzoP8An4h/7+L/AI1neIdSt9P0W+luriC3jigeR3mkVFVQCScnioqScYNxV3b8TSnGM5qM3ZN6+RY+22v/AD8w/wDfxf8AGlF7bH/l5h/7+L/jXwTpvxjg1X4uQeGdL1FdYlvbgzNZ2W9J408zYkhaHdGfNLZwJAFwdwOQD94j/SuTBZjHGSqRcGnTtzX23tbTrufQZlk7wEaUlUUlU05baPffXofL/wDwUe/aA8Sfs+fDTw9J4S1W30nxD4k12PR7O+uIFng0/wCR5bmVEcASyLHsgiLfKHmZ3VxCyN+Ctn43+KF7dzXE3jvxzNc3UrTTTS+J9WaSWRmLM7s1ySzMSSSeSTX7of8ABWDwzJq+t/DK6dZJbaxstcZAuPMLXK2luZFA6nyzBvx/dx618G+DPhz8NviNcm1vdMutIsbrI/tS2vbixuLdGPyw6hZ3MaFRxh5YNnHy7M+ZXyPHJYx5s3GF3G3LdK6jo7PT3rO+7XXQ/qPhpvDcL4V4XmnNPd8rlyq2trq/w2Vnbc/L6HSvEUx2R+GfFUjN91R4e1Ikn0H+h1+y//BCv4p+KtEGt+BvEc914c8U2rXOqeHrjUptQew1WxazeX7JNJOXNlNBc5WBmPlzRsQuwpGfiD9qf9kfUvgvrNjceHdUsdQ0HVJxDC15PJpskV1L/qbTUbiBpZrCeY/JH5xdJjiKaSR1ii3/AOCcfirxZo/xk13TPCuuT+G766to7y/FkFEmqR2zyJCtwW/eNJY3BlZJRuBhkRiwdMf0HwVDHYTEwrUITaabtGLbUk1Zq2uit2+4/inxAqZfmOXzw+JqxTipJOcrKUW2mnfdu63217n9Q9r4m1bSrC3s7PU9Ss7Ozhit7a3t7yeKG3hiQJHFEiOFSNEVVVVAVVUAAAVr2fxK8VaZIs9t4j8QW8qHckkOr3sbKfUMJ8j8K/P/AP4I0fF/4iav+z/4s8K+L/FGseJ/CelaxHN4eOr332yTT0eAyXFpbyPgyW1vNshELkmAXEMZKJFGv6C1+LZpTqUcZVpzTTU3qtno79e/4n8mcQYNYPM69GMoScZtJxd1o3Z2fbYKKKK5DxQooooAK5vxB4W/tfzbqOARXUpyzkZWQ9ss3Qn617l8KP2t/wDgn1+yPY/29+0toHxR8fSo0cnhvwnrukxaDbyKSDDd3UtxdrJ858vygkMZZS/nOAUP5af8FDv+Ci/jv9rCePRY4m8J+ALWXnw/bTM9xqMysHS51CdVBldSQ0cKBYI2G5Vkk/env5JwnmubxlPhPIcz4+z9aYnHSSweXxlrz+3qcs6lN9fY4Wc7bSqqS93zy/iXM/3k4UqEfhaUn5JpWXm3ZLzZ+3UfxC0W8t5rmw0/Wr+OzYrdeVpjyLbjbt3y7chMFgN3TJAzzX4Kf8HEv7SXhD4s/Hzwh4V8K6tba9F4B0q6/tfULV/MtZdUvZRILdZRw7W8UcMhZfl33AX7yCvtLwR/wWD/AGg/CsGmW2o67oHiddOhjtUk13RIjc+QpISWS4txBJcfKOTOZWJ5ZmJJPwh8Zvj943/al+LN/wCNPGWpPqGq3siRQwxgx2mm2ycQ2VpERtgt4wTtXJLMzO7M7s7dXFnDnENTL/8AhQZBDhDJ6jTnioNY7NZwal+/daUZRov/AKd4aEJ6J4ic78vLzw4rOFiP9klmdTpL+DC/6qzv3c77WTZ+if7UH7avwz+PX7N91qHgfxSsN94d8SXOhazpGqQS2OsaPOrxTYkjcYkiSaISwToGimiYMjoSDXzJ+wH+2hH+z544Gr6roH9t2OpWy6fqVmLgQXNq+/zYmgmZXAK7QysVKtGMlTuU+PUvbvjjxvq3xG8W6n4j169bUNY1a5a7vbphgNIRgKi5OyKNAI4o1+WONGVFU7Vr+ieF+H8Lw/hZUKNWdVzfNNzabbbS0aUbWStfTU/nvOM6r5ziHVqUowSVkrO6SS112d7vXdvsfZP7RHhXwV+yZ8OmvvB+reIPGHxB8UQSW+lnUJVmstIgKILu6it0VRK4djBBuIzsmZUYxox8V/ZU/az8Y/s2/ESz8RaBdvLbGRYtW0lnP2HWrXduMEyj7pO4mKYYeJmKkEMys/EfGvxT1j4q+LL3xB4h1GbUtWvpDJLNKxICDhIo1JxHDGv7uONeFQBRXO19/gszy/AYWOXYNctNRUVZpc23M7btpK7bu+vU+QxeV4zGYl4zFtOo5OTupK727JRdkrJKy27s/RD/AIJl/tla58NviDpvw78T3s114I8SXKafbi4kLf2Fqcr7YpIHY5jtpnbZLDkhHLSRfKREn9BVfzR+FfE11oWtabqVnO9ve6bdQX1pOnDwXEMqyxSKexV0U/hX9KHhPxBH4n8M6XrEW7y9TsrXUE3DBCzxLKoI9wrD8K/JeO8thhalHF047+4+lu0ZLd+TXz7n79wDnUsXQq4GrLT3pLvdpSjstndNrpddzaooor4k/VQooooAK+cP2xP2v9K/ZZ8JKfLi1Txbq0bSaNost1HbI8a/6+7uJMsLe1LKrOFDO7MkUYLvuT6C8YeJrfwj4W1XW7vP2XS7K51Cfy/v+XBE0r7R3O1Tge9fz8fGT4s6t8YviVrvi7XZFfUdauWuJQgxHbR8JDbwrk7YYYlSKJc8Roor6Hh3Kv7UxdrXhFXl2fdLz0+V35Hx/FmcfU8HZaxqS0j5d2/JfdfseiNZXepeOrSCa6Pn32o+WXmbe+JbiTMsjE5YurEkt1Y81a+HfiY+CvHmha0Jfs/9n3sU8rOxVFiDfvdxH91Nw4OcEA4OK8n1TWJ9UuHnuJS8jnJYnrVYXDf89P0r93hLljyxVkj+XpQ55OUnds/W9OSeR+wP0PUUAR9m/SpxcE9/0rzltUcfxfoKjOpyd3/QV8h/ZTbvzH2/9qpbKB6Y0rDuf0qIzjPU/pXnraiw/i/QVGNTYD7/AOlH9lPuH9tLseiG4GDzSfay/Rfzrzu21a6sbqG6tZ5rW6t5FmguIJGimgkU5WSORSGRweCrAEHkV3DfEy+v9Ns7tpLCS5nhjlusWdsZnlVVeTz3T5yWwS+SM88dK48Rlc6Mbyvp0OzC5rCrLl5Wa0d0zOApDDqCDkY7g+lfvt+xp8UJPin+zf4H1iaZZb2HS7fTb5lbaXubNTbSMw7b/L3j2YV+Alr4iGPvfpX6Tf8ABH/4pMmmeNfBM0xMdvNb69ZoTwqSmS3ukA9N0dtIfQyD1r4TjDL1Vwiqpawl+D0f5peh+icDZk6OOdFv3ai/FaP8mvU+6aKKK/BT+hwr4z/4KwfHm5+GnwN03wxpNy9rf+Otam065kRipbTrWMXFyAR1SXzIojnqswHTNeY/8FSv21Nb8DeJtF+GXhLUJtKb+zv7Z8TXlrIY7mIzPJFaafE4+aKRY0eeZl+ZfNijyDLkfnr+0Prt14g+KlzLdTNPLbWdjYlycs3kW0SZ/wC+UUf8Br9A4SySnUoTzKquaUWoxXZ2955dUm7LXofjnG+eTpV6eV0XyxkmptdU7+7HvZJuz03PNrm5a4meSRtzuckmo8D1P5VDRmv1VRUVZbH5Ntq7JOP7v61FPcpaxNJI6qqjJJOABUZ+ZsDrXnfxb8TNZWVpoUJ23d1E08uOSluG3KB7yFf++Vb1rycdjIYOg6r16Jd2ehg8HLF1lTW3V9kZ3jf4pGKOe00lhK0gKvdHlU9Qn+167eteb3t7JeTNJI5ZmOSSaq3NzJdTNJIxZmOST1JqE1+b4rFVcVU9pVd+nkvRH6Xh8LSw9P2dJWXfv6i0UUVgdAVf0PVptD1ew1K3YrPp91DeQsP4XikV1P4FRVCrFnCLq5gtw21ppY4lP+85Cj9TXNFON32Y5K6sz+lXR9Th1nSbK/t2DQXttDdRMO6SKHXv6EVcr4D/AOCYHxbbx1+zlFpN1MZL7wdez6UwZsuLSTNxaAn0VJJIl9rYV9+V+I5nhHhMXUw7/lbt6PdfK5/UWT4xY7B08Ut5K79Vo/mmfCf/AAVr+A934n8F+HfiDpVu01zoEp0fWljUlnspGMlvK+OojnDRgnpHcqMAO9fmxY6o1vGihhkKoJByccZOPU+nf09f3S1fSLTXdLvNNv4FuLK/t5bS7hbpLBMhSRGHoVYivwh+N/ww1D4Q/E/xF4T1RSJ9HvZLdZMYFxbE77edfRZoWSRfZ69/hXMFVoywk3rD3l5xf6r9PM+B42y90sRHGQWk/dfnH/g/kc7j3oqKivasfD3Z0Pgb4eah8Qtabs7YxWNox+0XTDIQ4+6g/vMR09OSQBmr/jD4jW/gqxl0Twwy/aB8s18B8iH+JIz3J7t27DqGfEvGXhzVJoPDlpG8lraYF3dRggTXP3jFu6+WhABA4ZwSOCteXu5dix5JOST3r85xOY1sfX9lRvzS26Jf1ZH6VhcupYGj7Ss7KPXu/L+rkl5eS31xJPPI0ksrF3djksT1JqKo980nmV5aVlZbHpXu7sbRRSCaYZKU/elr09SgopPOj/v/AJ0ecn979DVc9P8AnYLrst+hbswUupycLGoJLMxwAqjqSSQAAOSSQAOa1fDvhm/8V6tb6Xp8DNcXDAFtoIiTq8sh/hRR8zMegA7kA+xfDf4E2vh21XU9cjS71ORd0VqfmgtgeCW/56MOhP3R90ZJZvUyHhzE5lL20vdp36/afdL9X2Xkzmx+bUcGubSU+3b1/wAu/ZGJ8IPg/F4Gjh1PUo1m1hwGijIyllx95/RnH6L0HO5vfP2QNDbWfj5pV0F3poVhqmoMR/CzWrWq/mLk/lXP1976B8Mv+CcvwT8H28JuNFm8V3UYBa48QT/aFdv72y3VbZPwjFfrmDwlDL8NHC4eKUYrTu33b7tn5PXxFbG151q7bzf5Lsl0S6HoX7M/w0k+GnwY8L6JNGYb5bX7bqKMuGW9vCbidd3dVkdYwf8AnmnpXo9ItJX5jWqSq1JVZbybfzZ+pUacadONOOyil8kFfHn/AAUD/Zrm+I/haLxloVq03ibw/C/n28aFpNT0/cZDFgcmWBi0kQ6lPNQfcYj7DpCARgjIPY1vh8RPC140Z7rp3XVfM58VhoYqjKjPZ9e66P5H82lFetftRfBKT4L/ABe1fRVha30W5P8AaGizMuEuLGZiyID3kiYSQv6vET3rzLzf9uv2enUhVgqkHdPVH4ZUpypTcJqzWjL+gaBf+KNTt9M0uzuNQv7l9kFraxmSWVvZVHbqScAAEkgAkfWXwp/ZZ0DwXbxXuuQQa3qq4ZYpFDWcDf3VQ8yEf3n6/wB1TxXW/s0fBS1+EHw9t9PkiRtbvFW51i4AwZJ2HMYPdIQSqDpnLHljn2GvyPNuJKlaUsPg3yQWjl1k+66JefX0P1DLcgpUoxr4tXk9VHovN9X9y8zjPD3wy8N+GlX7FpFpG4GDNLGJpz/wORmf9a3RBGvRFH0FT0V8RPEVar5pzbb7ts+mjThBWjFJeRF5Ef8AzzT/AL5FRyWsEgw0aMPdQf5VYopKbWqbRTSezOf1LwL4f1WNkutJspCRgSCIJKv0dMMP1rg9d/Zn0TUHaTTrq60tuuyMieFfoscw/wC+q9SortoZhi8PpSqSS7X0+57GFTDUKvx00/lv9+54XZfsyabC6tf6peXCdTFFGlvn/gQMh/8AHq9B8O+C9E8KRldK0yztGIAaRIwZnA6BpDlz+Jro6K66+ZY3EK1WrJ+TTt9ysjCngcNSd4U195F6A5zn35paSivNOsWkoooAgubaG9t5be4iSaCZGimikUMkiMCGVlPBBBIIPIIr5I+JH7HfkXlxqPgq4j2Mxd9GumwV55+zzMeP9x259GY/L9c0V14TMcVgpOVCVr7rdfNdfz7nHjMvw+MilWje26ez9H/wNmfmvqGk32kXBgv7O4sphkGK5haJwR1GGAzWF4g8E6D4shKarpdnebhgSvEBKn+7IOHHsGBFfo5qWk2OrwmG9tILuI/wyxhv0PUfgawU+G3hOOTzF0HTxJnO7yFJz65xmvs6fGdVwvWpJvtF2X33Pl58GUlK1KbS7tXf3Wt+J8LeBf2YVhmiuvFd4syqQ39l2chKk91kmUqSP9iMg/3q9y0/TrXSbSO1soIra2iGEiiQIij2AGBU19pdlq0BhvbSC6jPWOaMOPyzVyvjcZmOKx01KvNtdFskvRHv4XBYfCRtRgk+73b9WFFFFcJ1BRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUhGRg9KKKAM2fw3pFw5eTTLF3PVmt0JP5irMGnWlpjybWCA/8ATOJUz+QoooAnoooqQP/Z';

// Cookie jar to store session cookie between requests
let sessionCookie = null;
let createdLocationIds = [];

/**
 * Helper function to extract and store session cookie
 * @param {object} response - Axios response object
 */
function storeSessionCookie(response) {
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader && setCookieHeader.length > 0) {
    // Extract the session cookie
    const cookies = setCookieHeader[0].split(';');
    sessionCookie = cookies[0]; // Format: sessionId=value
    console.log('Session cookie stored:', sessionCookie);
  }
}

/**
 * Calculate a simple hash of an array buffer for comparison
 * @param {ArrayBuffer} buffer - The buffer to hash
 * @return {string} The hash as a hex string
 */
function calculateSimpleHash(buffer) {
  const hash = crypto.createHash('md5');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}

/**
 * Test 1: Login and session creation
 */
async function testLogin() {
  console.log('\n🔑 TEST 1: Login and Session Creation');
  console.log('--------------------------------------');
  
  try {
    console.log(`POST ${API_BASE_URL}/verify-access`);
    console.log('Request body:', { accessCode: ACCESS_CODE });
    
    const response = await axios.post(`${API_BASE_URL}/verify-access`, {
      accessCode: ACCESS_CODE
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Store session cookie for subsequent requests
    storeSessionCookie(response);
    
    // Check if login was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during login test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 2: Create two test locations
 */
async function testCreateLocations() {
  console.log('\n📍 TEST 2: Create Multiple Test Locations');
  console.log('--------------------------------------');
  
  const location1 = {
    title: "Standort A - Bildzuordnungstest",
    description: "Erster Testeintrag für den Bildzuordnungstest",
    latitude: 51.5074,
    longitude: -0.1278,
    date: new Date().toISOString().split('T')[0]
  };
  
  const location2 = {
    title: "Standort B - Bildzuordnungstest",
    description: "Zweiter Testeintrag für den Bildzuordnungstest",
    latitude: 48.8566,
    longitude: 2.3522,
    date: new Date().toISOString().split('T')[0]
  };
  
  try {
    // Create first location
    console.log(`POST ${API_BASE_URL}/api/locations (Location A)`);
    console.log('Request body:', location1);
    
    const response1 = await axios.post(
      `${API_BASE_URL}/api/locations`, 
      location1, 
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
      }
    );
    
    console.log(`Status: ${response1.status} ${response1.statusText}`);
    console.log('Response data:', response1.data);
    
    // Create second location
    console.log(`POST ${API_BASE_URL}/api/locations (Location B)`);
    console.log('Request body:', location2);
    
    const response2 = await axios.post(
      `${API_BASE_URL}/api/locations`, 
      location2, 
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
      }
    );
    
    console.log(`Status: ${response2.status} ${response2.statusText}`);
    console.log('Response data:', response2.data);
    
    // Check if both creations were successful
    if (response1.status >= 200 && response1.status < 300 && 
        response2.status >= 200 && response2.status < 300 && 
        !response1.data.error && !response2.data.error) {
      // Store the IDs of the created locations for later tests
      createdLocationIds.push(response1.data.data.id);
      createdLocationIds.push(response2.data.data.id);
      console.log('✅ Both locations created successfully');
      console.log(`Created location A ID: ${createdLocationIds[0]}`);
      console.log(`Created location B ID: ${createdLocationIds[1]}`);
      return true;
    } else {
      console.log('❌ Location creation failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during location creation test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 3: Upload different images to each location
 */
async function testUploadDifferentImages() {
  console.log('\n🖼️ TEST 3: Upload Different Images to Each Location');
  console.log('-----------------------------------------------');
  
  if (createdLocationIds.length < 2) {
    console.error('❌ Not enough location IDs available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    // Upload image 1 to location A
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationIds[0]}/upload (Image 1)`);
    console.log('Request body: { imageData: [image 1 data], fileName: "location-a-image.jpg" }');
    
    const responseA = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationIds[0]}/upload`,
      {
        imageData: SAMPLE_IMAGE_1,
        fileName: 'location-a-image.jpg'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Status: ${responseA.status} ${responseA.statusText}`);
    console.log('Response data:', responseA.data);
    
    // Upload image 2 to location B
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationIds[1]}/upload (Image 2)`);
    console.log('Request body: { imageData: [image 2 data], fileName: "location-b-image.jpg" }');
    
    const responseB = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationIds[1]}/upload`,
      {
        imageData: SAMPLE_IMAGE_2,
        fileName: 'location-b-image.jpg'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Status: ${responseB.status} ${responseB.statusText}`);
    console.log('Response data:', responseB.data);
    
    // Check if both uploads were successful
    if (responseA.status === 200 && responseB.status === 200 && 
        !responseA.data.error && !responseB.data.error) {
      console.log('✅ Both images uploaded successfully');
      return true;
    } else {
      console.log('❌ Image upload failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during image upload test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 4: Verify images are correctly associated with their locations
 */
async function testVerifyImageAssociation() {
  console.log('\n🔍 TEST 4: Verify Image Association');
  console.log('--------------------------------');
  
  if (createdLocationIds.length < 2) {
    console.error('❌ Not enough location IDs available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    // Get image from location A
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationIds[0]}/image`);
    
    const responseImageA = await axios.get(
      `${API_BASE_URL}/api/locations/${createdLocationIds[0]}/image`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        responseType: 'arraybuffer'
      }
    );
    
    // Get image from location B
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationIds[1]}/image`);
    
    const responseImageB = await axios.get(
      `${API_BASE_URL}/api/locations/${createdLocationIds[1]}/image`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        responseType: 'arraybuffer'
      }
    );
    
    // Get thumbnails for both locations
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationIds[0]}/image?thumb=true`);
    
    const responseThumbnailA = await axios.get(
      `${API_BASE_URL}/api/locations/${createdLocationIds[0]}/image?thumb=true`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        responseType: 'arraybuffer'
      }
    );
    
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationIds[1]}/image?thumb=true`);
    
    const responseThumbnailB = await axios.get(
      `${API_BASE_URL}/api/locations/${createdLocationIds[1]}/image?thumb=true`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        responseType: 'arraybuffer'
      }
    );
    
    // Calculate hashes for comparison
    const hashImageA = calculateSimpleHash(responseImageA.data);
    const hashImageB = calculateSimpleHash(responseImageB.data);
    const hashThumbnailA = calculateSimpleHash(responseThumbnailA.data);
    const hashThumbnailB = calculateSimpleHash(responseThumbnailB.data);
    
    console.log(`Image A Hash: ${hashImageA}`);
    console.log(`Image B Hash: ${hashImageB}`);
    console.log(`Thumbnail A Hash: ${hashThumbnailA}`);
    console.log(`Thumbnail B Hash: ${hashThumbnailB}`);
    
    // Verify that the images are different
    if (hashImageA !== hashImageB && hashThumbnailA !== hashThumbnailB) {
      console.log('✅ Images are correctly associated with their locations (different hashes)');
      console.log(`Image A Size: ${responseImageA.data.byteLength} bytes`);
      console.log(`Image B Size: ${responseImageB.data.byteLength} bytes`);
      console.log(`Thumbnail A Size: ${responseThumbnailA.data.byteLength} bytes`);
      console.log(`Thumbnail B Size: ${responseThumbnailB.data.byteLength} bytes`);
      return true;
    } else {
      console.log('❌ Images are not correctly associated - hashes are identical!');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during image verification test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response headers:', error.response.headers);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 5: Clean up by deleting the test locations
 */
async function testCleanUp() {
  console.log('\n🧹 TEST 5: Clean Up');
  console.log('------------------');
  
  if (createdLocationIds.length === 0) {
    console.error('❌ No location IDs available for clean up. Previous tests may have failed.');
    return false;
  }
  
  try {
    let allSuccess = true;
    
    // Delete all created locations
    for (let i = 0; i < createdLocationIds.length; i++) {
      const locationId = createdLocationIds[i];
      console.log(`DELETE ${API_BASE_URL}/api/locations/${locationId}`);
      
      const response = await axios.delete(
        `${API_BASE_URL}/api/locations/${locationId}`,
        { 
          headers: sessionCookie ? { Cookie: sessionCookie } : {}
        }
      );
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response data:', response.data);
      
      // Check if deletion was successful
      if (!(response.status === 200 && !response.data.error)) {
        allSuccess = false;
        console.log(`❌ Failed to delete location with ID ${locationId}`);
      }
    }
    
    if (allSuccess) {
      console.log('✅ All test locations deleted successfully');
      return true;
    } else {
      console.log('❌ Some location deletions failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during clean up test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('🧪 STARTING MULTIPLE LOCATIONS IMAGE ASSOCIATION TESTS');
  console.log('=====================================================');
  console.log(`Server URL: ${API_BASE_URL}`);
  console.log(`Access Code configured: ${ACCESS_CODE ? 'Yes' : 'No'}`);
  
  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.error('❌ Login failed, aborting remaining tests');
      return;
    }
    
    // Test 2: Create multiple locations
    const createSuccess = await testCreateLocations();
    if (!createSuccess) {
      console.error('❌ Create locations failed, aborting remaining tests');
      return;
    }
    
    // Test 3: Upload different images
    const uploadSuccess = await testUploadDifferentImages();
    if (!uploadSuccess) {
      console.error('❌ Image uploads failed, some tests may be skipped');
    }
    
    // Test 4: Verify image association
    await testVerifyImageAssociation();
    
    // Test 5: Clean up
    await testCleanUp();
    
    console.log('\n🏁 ALL MULTIPLE LOCATIONS IMAGE ASSOCIATION TESTS COMPLETED');
  } catch (error) {
    console.error('\n💥 UNHANDLED ERROR DURING TESTS:');
    console.error(error);
  }
}

// Check for ACCESS_CODE before running tests
if (!ACCESS_CODE) {
  console.error('❌ ACCESS_CODE environment variable is not set. Tests will likely fail.');
  console.error('Please set the ACCESS_CODE environment variable and try again.');
  process.exit(1);
}

// Run the tests
runTests();